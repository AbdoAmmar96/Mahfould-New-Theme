<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    /** قائمة تذاكر العميل */
    public function index(Request $request): Response
    {
        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return Inertia::render('Account/Support/Index', [
            'tickets' => $tickets->through(fn ($t) => [
                'code' => $t->code,
                'subject' => $t->subject,
                'category' => $t->category,
                'category_label' => $t->category_label,
                'status' => $t->status,
                'status_label' => $t->status_label,
                'priority' => $t->priority,
                'priority_label' => $t->priority_label,
                'created_at' => $t->created_at->format('Y-m-d H:i'),
                'messages_count' => $t->messages()->count(),
            ]),
        ]);
    }

    /** فتح تذكرة جديدة */
    public function create(Request $request): Response
    {
        $bookings = $request->user()->bookings()->latest()->take(20)->get()
            ->map(fn ($b) => ['id' => $b->id, 'code' => $b->code, 'title' => $b->bookable?->title ?? '—']);

        return Inertia::render('Account/Support/Create', [
            'bookings' => $bookings,
            'preset_booking_id' => $request->query('booking_id') ? (int) $request->query('booking_id') : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'category' => ['required', Rule::in(['booking', 'payment', 'refund', 'complaint', 'general'])],
            'description' => ['required', 'string', 'max:5000'],
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
        ]);

        // العميل ما يقدرش يفتح تذكرة على حجز مش بتاعه
        if (!empty($data['booking_id'])) {
            $b = Booking::find($data['booking_id']);
            abort_unless($b && $b->user_id === $request->user()->id, 403);
        }

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'booking_id' => $data['booking_id'] ?? null,
            'subject' => $data['subject'],
            'category' => $data['category'],
            'description' => $data['description'],
            'priority' => $data['priority'] ?? 'normal',
            'status' => 'open',
        ]);

        return redirect()->route('account.support.show', $ticket->code)
            ->with('success', "تم فتح التذكرة {$ticket->code} — بنراجعها ونرد عليك قريب.");
    }

    /** عرض التذكرة + المحادثة */
    public function show(Request $request, string $code): Response
    {
        $ticket = SupportTicket::where('code', $code)
            ->with('messages.author', 'booking')
            ->firstOrFail();

        // العميل يشوف تذاكره فقط
        abort_unless($ticket->user_id === $request->user()->id, 403);

        return Inertia::render('Account/Support/Show', [
            'ticket' => [
                'code' => $ticket->code,
                'subject' => $ticket->subject,
                'description' => $ticket->description,
                'category_label' => $ticket->category_label,
                'status' => $ticket->status,
                'status_label' => $ticket->status_label,
                'priority' => $ticket->priority,
                'priority_label' => $ticket->priority_label,
                'booking_code' => $ticket->booking?->code,
                'created_at' => $ticket->created_at->format('Y-m-d H:i'),
                'closed_at' => $ticket->closed_at?->format('Y-m-d H:i'),
                'messages' => $ticket->messages
                    ->reject(fn ($m) => $m->is_internal)   // العميل ما يشوفش الملاحظات الداخلية
                    ->map(fn ($m) => [
                        'body' => $m->body,
                        'author_name' => $m->author?->name ?? 'دعم فني',
                        'is_customer' => $m->user_id === $ticket->user_id,
                        'created_at' => $m->created_at->format('Y-m-d H:i'),
                    ])->values(),
            ],
        ]);
    }

    /** رد العميل على التذكرة */
    public function reply(Request $request, string $code): RedirectResponse
    {
        $ticket = SupportTicket::where('code', $code)->firstOrFail();
        abort_unless($ticket->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => false,
        ]);

        // ترجع الحالة لـopen لو كانت waiting_customer
        if ($ticket->status === 'waiting_customer') {
            $ticket->update(['status' => 'in_progress']);
        }

        return back()->with('success', 'تم إرسال ردّك.');
    }
}
