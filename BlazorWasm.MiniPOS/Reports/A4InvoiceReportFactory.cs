using Pysar.Core.Enums;
using Pysar.Core.Structs;
using Pysar.Elements;
using PysarReport = Pysar.Elements.Report;
using ReportSize = Pysar.Core.Structs.Size;

namespace BlazorWasm.MiniPOS.Reports;

public static class A4InvoiceReportFactory
{
    public const string FontFamily = "MiniPosMyanmar";

    private static readonly Color Ink = Color.FromHex("#172033");
    private static readonly Color Muted = Color.FromHex("#667085");
    private static readonly Color Accent = Color.FromHex("#EA580C");
    private static readonly Color SoftAccent = Color.FromHex("#FFF3E8");
    private static readonly Color Rule = Color.FromHex("#E4E7EC");

    public static PysarReport Create(InvoiceReportModel invoice)
    {
        ArgumentNullException.ThrowIfNull(invoice);

        return ReportBuilder.Create($"Invoice {invoice.VoucherNumber}")
            .WithAuthor("MiniPOS")
            .WithPageFormat(new PageFormat
            {
                Size = PageSize.A4,
                Orientation = Orientation.Portrait,
                Margin = new Thickness(42, 36, 42, 32)
            })
            .WithReportHeader(header =>
            {
                header.Margin = new Thickness(0, 0, 0, 18);
                header.AddElement(BuildHeader(invoice));
            })
            .WithDetail(detail =>
            {
                detail.WithDetailHeader(header =>
                {
                    header.Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(32));
                    header.BackgroundColor = SoftAccent;
                    header.AddElement(BuildTableHeader());
                });
                detail.WithRepeatDetailHeader();
                detail.WithData(invoice.Lines, (line, row) => row.AddElement(BuildLine(line)));
            })
            .WithReportFooter(footer =>
            {
                footer.Margin = new Thickness(0, 18, 0, 0);
                footer.AddElement(BuildTotals(invoice));
            })
            .WithPageFooter(footer =>
            {
                footer.Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(24));
                footer.AddElement(CreateText(
                    "Thank you for shopping with MiniPOS",
                    9,
                    Muted,
                    TextAlignment.Center));
            })
            .Build();
    }

    private static StackPanel BuildHeader(InvoiceReportModel invoice)
    {
        var stack = new StackPanel
        {
            Size = new ReportSize(SizeLength.Fill, SizeLength.Auto),
            Spacing = 8
        };

        stack.AddElement(CreateText(invoice.StoreName, 22, Accent, TextAlignment.Start, FontStyle.Bold, 34));
        stack.AddElement(CreateText("SALE INVOICE", 11, Muted, TextAlignment.Start, FontStyle.Bold, 20));

        var metadata = new Grid
        {
            Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(58)),
            RowSpacing = 4,
            ColumnSpacing = 16
        }.WithColumnDefinitions("*,*").WithRowDefinitions("*,*");

        metadata.AddElement(CreateText("Invoice number", 8, Muted), 0, 0);
        metadata.AddElement(CreateText("Sale date", 8, Muted), 0, 1);
        metadata.AddElement(CreateText($"#{ShortVoucher(invoice.VoucherNumber)}", 11, Ink, fontStyle: FontStyle.Bold), 1, 0);
        metadata.AddElement(CreateText(invoice.SaleDate.ToString("dd MMM yyyy, HH:mm"), 11, Ink), 1, 1);
        stack.AddElement(metadata);

        stack.AddElement(new Frame
        {
            Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(1)),
            BackgroundColor = Rule
        });

        return stack;
    }

    private static Grid BuildTableHeader()
    {
        var grid = CreateTableGrid(32);
        grid.AddElement(CreateText("PRODUCT", 9, Accent, fontStyle: FontStyle.Bold), 0, 0);
        grid.AddElement(CreateText("QTY", 9, Accent, TextAlignment.End, FontStyle.Bold), 0, 1);
        grid.AddElement(CreateText("UNIT PRICE", 9, Accent, TextAlignment.End, FontStyle.Bold), 0, 2);
        grid.AddElement(CreateText("AMOUNT", 9, Accent, TextAlignment.End, FontStyle.Bold), 0, 3);
        return grid;
    }

    private static Grid BuildLine(InvoiceReportLineModel line)
    {
        var grid = CreateTableGrid(34);
        grid.BorderColor = Rule;
        grid.BorderThickness = new Thickness(0, 0, 0, 0.5f);
        grid.AddElement(CreateText(line.ProductName, 10, Ink), 0, 0);
        grid.AddElement(CreateText(line.Quantity.ToString("N0"), 10, Ink, TextAlignment.End), 0, 1);
        grid.AddElement(CreateText(line.UnitPrice.ToString("N0"), 10, Ink, TextAlignment.End), 0, 2);
        grid.AddElement(CreateText(line.Amount.ToString("N0"), 10, Ink, TextAlignment.End, FontStyle.Bold), 0, 3);
        return grid;
    }

    private static Grid BuildTotals(InvoiceReportModel invoice)
    {
        var grid = new Grid
        {
            Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(66)),
            RowSpacing = 6
        }.WithColumnDefinitions("*,150").WithRowDefinitions("24,36");

        grid.AddElement(CreateText("Subtotal", 10, Muted, TextAlignment.End), 0, 0);
        grid.AddElement(CreateText($"{invoice.Subtotal:N0} MMK", 11, Ink, TextAlignment.End), 0, 1);
        grid.AddElement(CreateText("GRAND TOTAL", 11, Accent, TextAlignment.End, FontStyle.Bold), 1, 0);
        grid.AddElement(CreateText($"{invoice.GrandTotal:N0} MMK", 16, Accent, TextAlignment.End, FontStyle.Bold), 1, 1);
        return grid;
    }

    private static Grid CreateTableGrid(float height) => new Grid
    {
        Size = new ReportSize(SizeLength.Fill, SizeLength.Fixed(height)),
        ColumnSpacing = 8
    }.WithColumnDefinitions("*,55,95,110").WithRowDefinitions("*");

    private static Text CreateText(
        string content,
        float fontSize,
        Color color,
        TextAlignment alignment = TextAlignment.Start,
        FontStyle fontStyle = FontStyle.Normal,
        float? height = null)
    {
        var text = new Text
        {
            Content = content,
            Font = new Font(FontFamily, fontSize, color, fontStyle),
            HorizontalTextAlignment = alignment,
            VerticalTextAlignment = TextAlignment.Center,
            Size = new ReportSize(SizeLength.Fill, height is null ? SizeLength.Fill : SizeLength.Fixed(height.Value)),
            Padding = new Thickness(6, 2, 6, 2)
        };

        return text;
    }

    private static string ShortVoucher(string voucherNumber)
        => voucherNumber.Length <= 12 ? voucherNumber : voucherNumber[..12].ToUpperInvariant();
}
