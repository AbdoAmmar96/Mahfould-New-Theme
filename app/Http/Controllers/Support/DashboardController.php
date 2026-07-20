<?php

namespace App\Http\Controllers\Support;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * V2-BLUEPRINT §15 — لوحة الدعم الفني (/support).
 * صلاحيات: role=support أو admin. بلا صلاحيات مالية/موافقات مزوّدين.
 */
class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'open');   // open | mine | resolved | all
        $q = SupportTicket::with('user:id,name,email', 'assignee:id,name');

        match ($status) {
            'mine' => $q->where('assigned_to', $request->user()->id)->open(),
            'resolved' => $q->whereIn('status', ['resolved', 'closed']),
            'unassigned' => $q->open()->unassigned(),
            'all' => null,
            default => $q->open(),
        };

        $tickets = $q->latest()->paginate(20)->withQueryString();

        $stats = [
            'open'       => SupportTicket::open()->count(),
            'unassigned' => SupportTicket::open()->unassigned()->count(),
            'mine'       => SupportTicket::open()->where('assigned_to', $request->user()->id)->count(),
            'today'      => SupportTicket::whereDate('created_at', today())->count(),
        ];

        return Inertia::render('Support/Dashboard', [
            'tickets' => $tickets->through(fn ($t) => [
                'code' => $t->code,
                'subject' => $t->subject,
                'category_label' => $t->category_label,
                'status' => $t->status,
                'status_label' => $t->status_label,
                'priority' => $t->priority,
                'priority_label' => $t->priority_label,
                'customer' => ['name' => $t->user?->name, 'email' => $t->user?->email],
                'assignee' => $t->assignee?->name,
                'created_at' => $t->created_at->format('Y-m-d H:i'),
                'created_ago' => $t->created_at->diffForHumans(),
            ]),
            'stats' => $stats,
            'current_status' => $status,
        ]);
    }

    public function show(string $code): Response
    {
        $ticket = SupportTicket::where('code', $code)
            ->with('user', 'assignee', 'booking', 'messages.author')
            ->firstOrFail();

        return Inertia::render('Support/Show', [
            'ticket' => [
                'code' => $ticket->code,
                'subject' => $ticket->subject,
                'description' => $ticket->description,
                'category' => $ticket->category,
                'category_label' => $ticket->category_label,
                'status' => $ticket->status,
                'status_label' => $ticket->status_label,
                'priority' => $ticket->priority,
                'priority_label' => $ticket->priority_label,
                'customer' => [
                    'name' => $ticket->user?->name,
                    'email' => $ticket->user?->email,
                    'phone' => $ticket->user?->phone,
                ],
                'assignee' => $ticket->assignee ? ['id' => $ticket->assignee->id, 'name' => $ticket->assignee->name] : null,
                'booking' => $ticket->booking ? ['code' => $ticket->booking->code, 'total' => $ticket->booking->total] : null,
                'created_at' => $ticket->created_at->format('Y-m-d H:i'),
                'messages' => $ticket->messages->map(fn ($m) => [
                    'body' => $m->body,
                    'author_name' => $m->author?->name ?? '—',
                    'is_customer' => $m->user_id === $ticket->user_id,
                    'is_internal' => $m->is_internal,
                    'created_at' => $m->created_at->format('Y-m-d H:i'),
                ])->values(),
            ],
        ]);
    }

    public function reply(Request $request, string $code): RedirectResponse
    {
        $ticket = SupportTicket::where('code', $code)->firstOrFail();
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['nullable', 'boolean'],
            'new_status' => ['nullable', Rule::in(['in_progress', 'waiting_customer', 'resolved', 'closed'])],
        ]);

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => (bool) ($data['is_internal'] ?? false),
        ]);

        $updates = [];
        if (!empty($data['new_status'])) {
            $updates['status'] = $data['new_status'];
            if (in_array($data['new_status'], ['resolved', 'closed'])) {
                $updates['closed_at'] = now();
            }
        }
        if (!$ticket->assigned_to) {
            $updates['assigned_to'] = $request->user()->id;   // اللي بيرد تلقائياً بيتعيّن
        }
        if ($updates) $ticket->update($updates);

        return back()->with('success', 'تم الرد.');
    }

    public function assign(Request $request, string $code): RedirectResponse
    {
        $ticket = SupportTicket::where('code', $code)->firstOrFail();
        $ticket->update(['assigned_to' => $request->user()->id, 'status' => 'in_progress']);
        return back()->with('success', 'اتعيّن ليك.');
    }
}
