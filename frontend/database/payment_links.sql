-- Create payment_links table to store generated payment URLs
create table payment_links (
  id uuid default uuid_generate_v4() primary key,
  invoice_id varchar not null,
  customer_name varchar not null,
  phone varchar(10) not null,
  amount decimal(10,2) not null,
  payment_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create unique constraint on invoice_id to prevent duplicates
ALTER TABLE payment_links ADD CONSTRAINT payment_links_invoice_id_key UNIQUE (invoice_id);

-- Create index on invoice_id for faster lookups
create index payment_links_invoice_id_idx on payment_links(invoice_id);

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger to update updated_at on each update
create trigger update_payment_links_updated_at
    before update on payment_links
    for each row
    execute function update_updated_at_column();


ALTER TABLE payment_links ADD CONSTRAINT payment_links_invoice_id_key UNIQUE (invoice_id);