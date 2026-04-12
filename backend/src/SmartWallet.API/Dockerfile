FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/SmartWallet.API/SmartWallet.API.csproj", "src/SmartWallet.API/"]
COPY ["src/SmartWallet.Application/SmartWallet.Application.csproj", "src/SmartWallet.Application/"]
COPY ["src/SmartWallet.Domain/SmartWallet.Domain.csproj", "src/SmartWallet.Domain/"]
COPY ["src/SmartWallet.Infrastructure/SmartWallet.Infrastructure.csproj", "src/SmartWallet.Infrastructure/"]

RUN dotnet restore "src/SmartWallet.API/SmartWallet.API.csproj"

COPY . .

WORKDIR "/src/src/SmartWallet.API"
RUN dotnet publish "SmartWallet.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SmartWallet.API.dll"]