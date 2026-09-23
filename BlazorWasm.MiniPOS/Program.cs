using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Blazored.LocalStorage;
using Blazored.SessionStorage;
using BlazorWasm.MiniPOS;
using BlazorWasm.MiniPOS.Services;
using Pysar.Blazor;
using Pysar.Core.Enums;


var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddBlazoredLocalStorage();
builder.Services.AddBlazoredSessionStorage();

builder.Services.AddScoped<LocalStorageProvider>();
builder.Services.AddScoped<SessionStorageProvider>();
builder.Services.AddScoped<IndexedDbProvider>();

builder.Services.AddScoped<IStorageService, StorageService>();

// IDbService now uses IStorageService to get the current provider
builder.Services.AddScoped<IDbService, AppDbService>();
builder.Services.AddScoped<DataSeederService>();

builder.Services.AddSingleton<ChartStateContainer>();
builder.Services.AddPysar();

var host = builder.Build();
var http = host.Services.GetRequiredService<HttpClient>();
var reportFiles = await PreloadedFileSystem.FetchAsync(http, [
    "fonts/NotoSansMyanmar.ttf"
]);
var reportPlatform = WasmPlatformHandler.Install(reportFiles);
reportPlatform.FontCollection.AddFont(
    "fonts/NotoSansMyanmar.ttf",
    "MiniPosMyanmar",
    FontStyle.Normal);
reportPlatform.FontCollection.AddFont(
    "fonts/NotoSansMyanmar.ttf",
    "MiniPosMyanmar",
    FontStyle.Bold);

await host.RunAsync();
