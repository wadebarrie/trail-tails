-- Built-in customer invoicing v1 (CAD, manual payments; no Stripe / email / tax).

CREATE TABLE public.invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id    uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  period_start   date NOT NULL,
  period_end     date NOT NULL,
  currency       text NOT NULL DEFAULT 'CAD',
  subtotal_cents integer NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  total_cents    integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  due_date       date,
  sent_at        timestamptz,
  paid_at        timestamptz,
  invoice_number text NOT NULL,
  notes          text,
  created_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_period_check CHECK (period_end >= period_start),
  CONSTRAINT invoices_company_number_key UNIQUE (company_id, invoice_number)
);

CREATE INDEX invoices_company_status_idx ON public.invoices (company_id, status);
CREATE INDEX invoices_customer_idx ON public.invoices (customer_id);

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoice_lines (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  hike_date         date NOT NULL,
  dog_id            uuid REFERENCES public.dogs(id) ON DELETE SET NULL,
  description       text NOT NULL,
  quantity          integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_cents integer NOT NULL DEFAULT 0 CHECK (unit_amount_cents >= 0),
  line_total_cents  integer NOT NULL DEFAULT 0 CHECK (line_total_cents >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoice_lines_invoice_idx ON public.invoice_lines (invoice_id);

CREATE TABLE public.payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  method       text NOT NULL CHECK (method IN ('e_transfer', 'cash', 'other')),
  paid_at      timestamptz NOT NULL DEFAULT now(),
  reference    text,
  recorded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_invoice_idx ON public.payments (invoice_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_admin_all ON public.invoices
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY invoice_lines_admin_all ON public.invoice_lines
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.company_id = public.user_company_id()
    )
  );

CREATE POLICY payments_admin_all ON public.payments
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = payments.invoice_id
        AND i.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = payments.invoice_id
        AND i.company_id = public.user_company_id()
    )
  );
