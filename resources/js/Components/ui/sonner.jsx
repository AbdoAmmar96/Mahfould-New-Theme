import { Toaster as SonnerToaster, toast } from 'sonner';

// Toaster محفول مكفول — RTL + هوية اللوجو
function Toaster(props) {
    return (
        <SonnerToaster
            dir="rtl"
            position="top-center"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'font-body font-semibold rounded-input shadow-mk-lg',
                    success: '!bg-makfol !text-white !border-makfol',
                    error: '!bg-danger !text-white !border-danger',
                    info: '!bg-navy !text-white !border-navy',
                    warning: '!bg-vip !text-white !border-vip',
                },
            }}
            {...props}
        />
    );
}

export { Toaster, toast };
