CREATE OR REPLACE FUNCTION public.guard_order_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_method = 'razorpay' AND NEW.payment_status = 'paid' AND NEW.razorpay_payment_id IS NULL THEN
    RAISE EXCEPTION 'Online payments can only be marked paid after Razorpay verification.';
  END IF;
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := now();
    NEW.paid_amount := coalesce(NEW.paid_amount, NEW.booking_amount);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_guard_payment BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_payment();