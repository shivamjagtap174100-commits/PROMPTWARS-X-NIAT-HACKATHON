import type { SamplePreset } from '../types/privacy';

/**
 * Primary comprehensive sample used by one-click "Load sample data" and Demo Mode.
 * Contains valid PII across all 6 categories, repeated entities, invalid candidates,
 * ordinary non-PII numeric sequences, and normal operational prose.
 */
export const NOISY_SAMPLE_TEXT = `INCIDENT TRIAGE & CUSTOMER ESCALATION LOG — Q4-2026-8841
Environment: prod-ap-south-1 | Ticket Reference: 2026112701 | Batch Qty: 4500

1. Primary Contact & Escalation Thread
Customer Name: Aarav Kulkarni
Primary Email: shivam@example.com
Support Alias: support@company.in
Secondary Copy (Duplicate): shivam@example.com
QA Escalation Contact: user.name@example.org
Malformed Email (Ignored): invalid-email@ or missing-tld@internal

2. Telecom & Routing Telemetry
Indian Mobile (Primary): +91 98765 43210
Callback Confirmation (Duplicate): +91 98765 43210
Local Mobile Format: 9876543210
US Engineering Desk: +1 (415) 555-0192
UK Compliance Line: +44 20 7946 0958
Ordinary Order / Sequence Numbers (Not PII): 1234567890, 4500129901, 2026-11-27

3. Network Access Logs
Ingress Gateway IPv4: 192.168.1.45
Edge Proxy IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
Compressed IPv6 Node: 2001:db8::1
Invalid IPv4 Candidate (Rejected): 999.312.10.1

4. KYC & Billing Snippets
Tax PAN Record: ABCDE1234F (Format validated, repeated: ABCDE1234F)
Aadhaar Reference (Format Only): 2345 6789 0123
Alternate Hyphen Format: 3456-7890-1234
Luhn-Valid Test Card (Visa): 4111-1111-1111-1111
Luhn-Valid Test Card (Mastercard): 5500000000000004
Luhn-Invalid 16-Digit Candidate (Rejected): 4111-1111-1111-1112
Random Numeric Reference (Rejected): 9812345678901234

5. Clean Operational Notes
All routine health checks succeeded within 140ms SLA without customer impact.`;

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'comprehensive',
    label: 'Full Benchmark',
    description: 'All 6 PII categories, duplicates, malformed emails, and invalid cards',
    fileKind: 'text',
    content: NOISY_SAMPLE_TEXT,
  },
  {
    id: 'indian-business',
    label: 'Indian Business KYC',
    description: 'Vendor onboarding record with PAN, Aadhaar format, +91 phones, and billing card',
    fileKind: 'text',
    content: `VENDOR ONBOARDING & GST SETTLEMENT DOSSIER — FY26-MH-104
Entity: Sahyadri Precision Systems Pvt. Ltd. | Invoice Ref: INV-2026-88401

Authorized Signatory: Rohan Deshmukh
Accounts Payable Email: finance@sahyadrisystems.in
Director Copy: rohan.deshmukh@sahyadrisystems.in
Repeated Payable Contact: finance@sahyadrisystems.in

Primary Mobile: +91 98201 44550
Treasury Desk: 9820144550
Corporate PAN: ABCDE1234F (Duplicate reference: ABCDE1234F)
Aadhaar Reference (Format Only): 2345 6789 0123
Corporate Settlement Card (Luhn Valid): 4111-1111-1111-1111
Rejected Reference Number (Fails Luhn): 4111-1111-1111-1112
Settlement Gateway IP: 10.42.18.90

Remarks: GST filing reconciled for Pune Zone without manual variance.`,
  },
  {
    id: 'customer-support',
    label: 'Support Ticket',
    description: 'Repeated customer email/phone threads ideal for testing Consistent Pseudonyms',
    fileKind: 'text',
    content: `SUPPORT TICKET #SUP-44920 — PAYMENT RETRY ESCALATION
Agent: Meera Nair | Priority: P2 | Order Total: INR 4,290

[10:12] Customer Ananya Rao (ananya.rao@example.in) reported double debit.
[10:14] Callback requested on +91 98765 43210; SMS receipt sent to +91 98765 43210.
[10:18] Escalated by billing@finpay.co.in with masked card check 5500000000000004.
[10:21] Customer replied from ananya.rao@example.in confirming webhook IP 192.168.1.45.
[10:24] Tracking ID 4500129901 verified cleanly without PII leakage.`,
  },
  {
    id: 'technical-log',
    label: 'Technical Log',
    description: 'Nginx/auth trace with IPv4, IPv6, invalid octets, timestamps, and alert emails',
    fileKind: 'text',
    content: `2026-11-27T10:24:01Z WARN auth-gateway: 3 failed tokens from 192.168.1.45
2026-11-27T10:24:04Z INFO edge-proxy: upstream ipv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334 healthy
2026-11-27T10:24:09Z INFO failover-node: routed via compressed 2001:db8::1 (latency 38ms)
2026-11-27T10:24:12Z NOTICE parser-guard: ignored bogus host 999.312.10.1 and build v1.2.3.4.5
2026-11-27T10:24:15Z ALERT pager: dispatched incident summary to oncall.sre@cloudops.in
2026-11-27T10:24:18Z INFO audit: request id 1234567890 completed with status 200`,
  },
  {
    id: 'csv-ledger',
    label: 'CSV Export Sample',
    description: 'RFC 4180 CSV with quoted fields, embedded commas, PAN, cards, and repeated emails',
    fileKind: 'csv',
    fileName: 'support-exports-sample.csv',
    content: `Customer,Email,Contact,KYC_Note,Card
"Kulkarni, Aarav",shivam@example.com,+91 98765 43210,"PAN ABCDE1234F, verified locally",4111-1111-1111-1111
"Deshmukh, Sneha",sneha@company.in,9876543210,"Aadhaar 2345 6789 0123, IP 192.168.1.45",5500000000000004
"Kulkarni, Aarav",shivam@example.com,+91 98765 43210,"Follow-up ticket 4500129901, resolved",4111-1111-1111-1112`,
  },
];
