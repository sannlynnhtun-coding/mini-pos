using BlazorWasm.MiniPOS.Models;

namespace BlazorWasm.MiniPOS.Reports;

public sealed record InvoiceReportModel(
    string StoreName,
    string VoucherNumber,
    DateTime SaleDate,
    IReadOnlyList<InvoiceReportLineModel> Lines)
{
    public int Subtotal => Lines.Sum(line => line.Amount);

    public int GrandTotal => Subtotal;

    public static InvoiceReportModel From(
        SaleVoucherHeadDataModel head,
        IEnumerable<SaleVoucherDetailDataModel> details)
    {
        ArgumentNullException.ThrowIfNull(head);
        ArgumentNullException.ThrowIfNull(details);

        var lines = details
            .Select(detail => new InvoiceReportLineModel(
                detail.product_name,
                detail.product_qty,
                detail.product_price))
            .ToList();

        return new InvoiceReportModel(
            "MiniPOS Store",
            head.sale_voucher_no.ToString(),
            head.sale_date,
            lines);
    }
}

public sealed record InvoiceReportLineModel(
    string ProductName,
    int Quantity,
    int UnitPrice)
{
    public int Amount => Quantity * UnitPrice;
}
