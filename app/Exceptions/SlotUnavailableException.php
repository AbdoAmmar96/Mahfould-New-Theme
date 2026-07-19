<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * تُرمى عند عدم توفّر وحدات كافية للتواريخ المطلوبة.
 * الطبقة الأعلى (BookingController) بتترجمها لرسالة للعميل.
 */
class SlotUnavailableException extends RuntimeException
{
    public function __construct(string $message = 'التواريخ المطلوبة لم تعد متاحة — جرّب تواريخ أخرى.')
    {
        parent::__construct($message);
    }
}
