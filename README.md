# Gunes Enerjili Telefon Sarj Istasyonu Simulatoru

Bu proje, gunes enerjisi ile calisan bir telefon sarj istasyonunun gercekci simulasyonunu sunar. Universite projesi olarak gelistirilmistir.

## Proje Hakkinda

Sistem, 10W'lik bir gunes panelinin gun boyunca enerji uretimini simule eder. Uretilen enerji 37Wh kapasiteli bir bataryada depolanir ve USB uzerinden telefon sarj etmek icin kullanilir. Hava durumu, gun isigi ve telefon baglantisi gibi parametreler kullanici tarafindan kontrol edilebilir.

### Ozellikler

- Gercekci gunes paneli uretim modeli (bell curve, gun dongusu)
- Batarya sarj/desarj simulasyonu (verimlilik kayiplari dahil)
- Hava durumu etkileri (Gunesli, Parcali Bulutlu, Bulutlu, Gece)
- Canli dashboard ile anlk izleme
- 24 saatlik gecmis grafikleri
- Simulasyon hizi kontrolu (1x - 60x)

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Mobil | Expo SDK 51, React Native, TypeScript |
| UI | React Native Paper, Material Community Icons |
| Grafikler | Custom bar chart components |
| API | REST (JSON) |

## Kurulum

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend http://localhost:8000 adresinde calisacaktir. API dokumantasyonu icin http://localhost:8000/docs adresini ziyaret edebilirsiniz.

### Mobil Uygulama

```bash
cd mobile
npm install
npx expo start
```

Expo DevTools acildiktan sonra:
- Android: Expo Go uygulamasindan QR kodu tarayin
- iOS: Kamera uygulamasindan QR kodu tarayin
- Web: `w` tusuna basin

### Backend Baglantisi

Mobil uygulamayi backend'e baglamak icin bilgisayarinizin yerel IP adresini kullanin:

```bash
# Windows'ta IP adresinizi ogrenmek icin:
ipconfig

# Mobil uygulamayi baslatirken:
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000 npx expo start
```

`192.168.1.XXX` kismini kendi IP adresinizle degistirin.

## API Endpointleri

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | `/status` | Anlk simulasyon durumu |
| GET | `/history` | Son 24 saatlik veri |
| POST | `/control` | Hava durumu, telefon ve hz ayarlari |
| POST | `/reset` | Simulasyonu sifirla |
| GET | `/health` | Saglik kontrolu |

## Ekran Goruntuleri

> Ekran goruntuleri buraya eklenecektir.

## Proje Yapisi

```
solar-charging-station/
├── backend/
│   ├── main.py           # FastAPI sunucusu
│   ├── simulator.py      # Simulasyon motoru
│   ├── models.py         # Pydantic modelleri
│   └── requirements.txt  # Python bagimliklar
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx   # Tab navigasyon
│   │   ├── index.tsx     # Dashboard ekrani
│   │   ├── history.tsx   # Gecmis grafikleri
│   │   └── control.tsx   # Kontrol paneli
│   ├── components/
│   │   ├── BatteryIndicator.tsx
│   │   ├── PowerGauge.tsx
│   │   └── WeatherSelector.tsx
│   ├── hooks/
│   │   └── useSimulation.ts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Lisans

Bu proje egitim amaclidir.
