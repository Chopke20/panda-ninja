# 🐼 Obowiązki Pandy Ninja — specyfikacja projektu

**Wersja:** 1.0 · **Data:** 2026-09-02
**Cel:** aplikacja na iPada, która pomaga dwóm synom (6 i 8 lat) samodzielnie przejść poranną rutynę przed wyjściem do szkoły.

---

## 1. Koncepcja

Poranek to **trening w dojo**. Każdy syn ma własną pandę-ninja. Panda budzi się śpiąca; każde odhaczone zadanie ją rozbudza i wzmacnia; po komplecie panda świętuje. Dziecko nie „odhacza listy obowiązków" — ono rozpędza swojego wojownika.

**Zasada projektowa:** żadnych kar, żadnych smutnych min, żadnego wyścigu między braćmi. Postęp każdego jest widoczny osobno, ale nagroda za komplet jest wspólna. Przy różnicy dwóch lat wyścig zawsze wygrywałby starszy, a to demotywuje młodszego.

---

## 2. Ekran główny (iPad, orientacja pionowa)

```
┌───────────────────────────────────────────────┐
│                                               │
│                 07:12                         │   Strefa 1 — CZAS (≈20% wys.)
│   ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░  → 07:40        │
│   Zostało 28 minut                     🔔     │
│                                               │
├───────────────────────┬───────────────────────┤
│                       │                       │
│    [ PANDA ANTKA ]    │    [ PANDA JASIA ]    │   Strefa 2 — PANDY (≈32% wys.)
│      animacja         │      animacja         │
│                       │                       │
│   Antek    ⭐ 340     │   Jasiu    ⭐ 285     │
│   ▓▓▓▓▓░░░ 3/7        │   ▓▓░░░░░░ 2/7        │
├───────────────────────┼───────────────────────┤
│  ☑  🛏  Wstać         │  ☑  🛏  Wstać         │   Strefa 3 — ZADANIA (≈42% wys.)
│  ☑  👕  Ubranie       │  ☐  👕  Ubranie       │   scrollowana niezależnie
│  ☑  🥣  Śniadanie     │  ☑  🥣  Śniadanie     │   w każdej kolumnie
│  ☐  🪥  Zęby          │  ☐  🪥  Zęby          │
│  ☐  🎒  Plecak        │  ☐  🎒  Plecak        │
│  ☐  🧥  Kurtka        │  ☐  🧥  Kurtka        │
├───────────────────────┴───────────────────────┤
│  🥋  Obie pandy gotowe = +50 pkt bonusu   ⚙️  │   Strefa 4 — STOPKA (≈6% wys.)
└───────────────────────────────────────────────┘
```

**Orientacja pozioma (landscape):** ten sam podział, ale pandy lądują po lewej (jedna nad drugą), a listy zadań po prawej w dwóch kolumnach. Aplikacja musi działać w obu orientacjach — iPad w kuchni bywa w etui.

### Strefa 1 — Czas

- **Zegar** HH:MM, bardzo duży (min. 96 px), font tabelaryczny (cyfry o stałej szerokości, żeby nie skakały).
- **Oś czasu do wyjścia** — pasek poziomy. Wypełnia się od lewej w miarę upływu czasu.
  - Godzina wyjścia jest ustawiana osobno **na każdy dzień tygodnia** w panelu rodzica.
  - Oś ma **okno widoczności** (domyślnie 90 minut przed wyjściem). Jeśli do wyjścia jest więcej niż 90 minut, pasek jest wygaszony, a pod nim widnieje „Do wyjścia: 3 godz 12 min" — bez presji.
  - Wejście w okno = start rutyny: pasek się rozświetla, pandy się budzą, leci delikatny gong.
  - Kolor paska: **zielony** (>50% czasu zostało) → **bursztynowy** (50–20%) → **czerwony** (<20%).
  - Na pasku znaczniki ostrzeżeń (T-20, T-10, T-5) jako małe kreski.
- **Podpis** pod paskiem: „Zostało 28 minut" / „Ostatnie 5 minut!" / „Czas wychodzić!".
- **Ikona dzwonka** 🔔 — przełącznik wyciszenia dźwięku na dziś (dostępny dla dziecka, ale wraca do „włączony" następnego dnia).

### Strefa 2 — Pandy

Każda panda w swoim „panelu dojo". Panda ma **cztery stany**, wybierane automatycznie:

| Stan | Kiedy | Wygląd |
|---|---|---|
| `sleeping` | przed oknem rutyny lub 0 zadań zrobionych | siedzi, zZz, broń leży obok |
| `training` | 1+ zadanie zrobione, jesteście w grafiku | pozycja bojowa, broń w dłoniach |
| `hurry` | zostało <20% czasu, a lista niepełna | ta sama poza + szybsza animacja, lekkie drżenie |
| `celebrating` | wszystkie zadania odhaczone | skacze, broń w górze, gwiazdki |

Dodatkowo **animacja mrugnięcia** co 4–7 s w stanie `sleeping` i `training` (lekkie ożywienie postaci przy zerowym koszcie).

Pod pandą: imię dziecka (z ustawień), licznik punktów ogółem ⭐, pasek postępu dnia „3/7".

### Strefa 3 — Zadania

- Dwie niezależnie scrollowane kolumny — **listy synów są osobne** i mogą się różnić (6-latek ma mniej i prostszych zadań).
- Każdy kafel: duży checkbox + ikona + krótkie słowo. Minimalna wysokość kafla **72 px**, cały kafel jest polem dotyku (nie sam checkbox).
- Tap = check → dźwięk + haptyka (jeśli dostępna) + animacja „+10 ⭐" lecąca do licznika punktów + panda robi mikro-reakcję.
- **Odznaczenie** jest możliwe (pomyłki się zdarzają), ale wymaga przytrzymania 1 s — żeby nie odklikać przypadkiem.
- Kolejność zadań ustawia rodzic. Zadanie może być przypisane tylko do wybranych dni tygodnia (np. „strój na WF" tylko we wtorek).
- Zrobione zadania **nie znikają** — przesuwają się na dół z wygaszonym stylem i szarym haczykiem. Dziecko widzi swój dorobek.

### Strefa 4 — Stopka

- Wspólny cel dnia: „Obie pandy gotowe = +50 pkt bonusu", z podświetleniem gdy osiągnięty.
- Ikona ⚙️ — wejście do panelu rodzica (zamknięte PIN-em).

---

## 3. Ekrany poboczne

### 3.1 Ekran startowy (Dzień dobry)

Pojawia się po otwarciu aplikacji. **Konieczny technicznie:** iOS Safari nie pozwala odtwarzać dźwięku bez pierwszego dotknięcia ekranu — ten tap odblokowuje audio i włącza Wake Lock.

Zawartość: obie śpiące pandy, duży przycisk „🥋 Zaczynamy trening!", pod nim data i godzina dzisiejszego wyjścia.

### 3.2 Podsumowanie dnia

Uruchamia się automatycznie o godzinie wyjścia (T-0) i pokazuje przez 3 minuty, potem wraca do ekranu głównego.

Ton: **bez kary i bez smutnej pandy.** Zawartość:
- „Antek: 60 z 90 punktów. Jasiu: 90 z 90 punktów."
- Zdobyte dziś punkty + nowy stan konta ⭐.
- Seria dni: „🔥 4 dni z rzędu z kompletem" (seria liczy się osobno dla każdego).
- Postęp do nagrody tygodniowej.
- Jedno zdanie zamykające: „Jutro damy radę!" albo „Perfekcyjny trening!" — zależnie od wyniku.

### 3.3 Panel rodzica (za PIN-em)

**Zamek:** 4-cyfrowy PIN, domyślnie `1111`, zmienialny. Klawiatura numeryczna na pełnym ekranie, 5 błędnych prób = 60 s blokady.

Zakładki:

1. **Dzieci** — imię, wybór pandy (broń, kolor opaski, kimono, kolor akcentu), reset punktów.
2. **Zadania** — lista per dziecko: dodaj / edytuj / usuń / zmień kolejność (drag), wybór ikony z galerii, liczba punktów, dni tygodnia w które obowiązuje. Przycisk „skopiuj listę do drugiego dziecka".
3. **Czas** — godzina wyjścia na każdy dzień pon–nd (dzień można wyłączyć: weekend = brak rutyny), szerokość okna rutyny (domyślnie 90 min), minuty ostrzeżeń (domyślnie 20 / 10 / 5 / 0).
4. **Nagrody** — nazwa nagrody tygodniowej + próg punktowy (np. „Wybór filmu w piątek — 400 pkt"). Rodzic wpisuje dowolny tekst. Pole „nagroda specjalna" na ad-hoc pomysły.
5. **Dźwięk** — głośność, włącz/wyłącz lektora, wybór głosu z listy dostępnych polskich głosów systemowych, test każdego dźwięku.
6. **Historia** — tabela ostatnich 30 dni: data, kto ile zrobił, czy zdążyli. Eksport do CSV.
7. **Dane** — eksport / import całej konfiguracji jako plik JSON (backup przed czyszczeniem pamięci przeglądarki).

---

## 4. Punkty i nagrody

- Każde zadanie ma własną wagę punktową ustawianą przez rodzica (domyślnie 10).
- **Bonus za komplet** własnej listy: +20 pkt.
- **Bonus wspólny**: obie listy kompletne przed godziną wyjścia → +50 pkt dla każdego.
- **Bonus za tempo**: komplet co najmniej 10 minut przed wyjściem → +15 pkt.
- Punkty **kumulują się bezterminowo** — to jest waluta na przyszły sklepik ze skinami. Nie zerują się co tydzień.
- **Nagroda tygodniowa** to osobny licznik: suma punktów z bieżącego tygodnia (pon–nd) porównywana z progiem ustawionym przez rodzica. Reset w poniedziałek o 00:00.
- **Seria (streak)**: liczba kolejnych dni szkolnych z kompletem listy. Przerwana wraca do zera, ale nie odbiera punktów.

---

## 5. Dźwięk i głos

Dźwięki są **syntezowane w kodzie** (Web Audio API) — zero plików do pobrania, działa offline, brak problemów licencyjnych.

| Zdarzenie | Dźwięk |
|---|---|
| Odhaczenie zadania | krótki dzwonek dwutonowy (bell, 880→1320 Hz, 180 ms) |
| Komplet własnej listy | wznoszące arpeggio 5 nut + uderzenie taiko |
| Bonus wspólny | fanfara + podwójne taiko |
| Start okna rutyny | pojedynczy gong (niski, długi pogłos) |
| Ostrzeżenie T-20 / T-10 / T-5 | uderzenie taiko × liczba (1 / 2 / 3), coraz wyższe |
| Godzina wyjścia | gong ×3 + komunikat lektora |
| Odznaczenie zadania | krótki „puf", bardzo cichy |

**Lektor:** syntezator mowy systemowy (Web Speech API), głos polski, np. `pl-PL`. Komunikaty:
- T-20: „Zostało dwadzieścia minut."
- T-10: „Dziesięć minut do wyjścia. Sprawdźcie plecaki."
- T-5: „Pięć minut! Kurtki i buty."
- T-0: „Czas wychodzić z mamą!"
- Komplet: „Antek gotowy! Świetny trening."

Teksty komunikatów są **edytowalne w panelu rodzica** — jeśli kiedyś zmieni się kto odprowadza, nie trzeba ruszać kodu.

---

## 6. Model danych

```ts
type Weekday = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';

type PandaConfig = {
  weapon: 'bo' | 'katana' | 'nunchaku' | 'kama' | 'shuriken' | 'sai';
  headband: 'white' | 'red' | 'blue' | 'green' | 'black';
  outfit: 'charcoal' | 'indigo' | 'crimson' | 'forest';
  accent: string;           // hex, kolor ramki panelu i pasków
};

type Task = {
  id: string;
  label: string;            // "Umyć zęby"
  icon: string;             // id ikony z galerii, np. "toothbrush"
  points: number;           // domyślnie 10
  order: number;
  days: Weekday[];          // w które dni obowiązuje
  enabled: boolean;
};

type Kid = {
  id: string;
  name: string;             // wpisywane w ustawieniach
  panda: PandaConfig;
  tasks: Task[];
  totalPoints: number;      // konto bezterminowe
  streak: number;
};

type DayLog = {
  date: string;             // "2026-09-02"
  kidId: string;
  completedTaskIds: string[];
  pointsEarned: number;
  finishedAt: string | null;   // ISO, moment ostatniego checka
  onTime: boolean;
};

type Settings = {
  departure: Record<Weekday, string | null>;   // "07:40" albo null = brak rutyny
  routineWindowMin: number;                    // 90
  warningsMin: number[];                       // [20, 10, 5, 0]
  voiceLines: Record<string, string>;          // edytowalne teksty lektora
  ttsEnabled: boolean;
  ttsVoiceURI: string | null;
  volume: number;                              // 0–1
  pin: string;                                 // "1111"
  weeklyReward: { label: string; points: number } | null;
  bonuses: { ownComplete: number; bothComplete: number; earlyFinish: number };
};

type AppState = {
  kids: [Kid, Kid];
  settings: Settings;
  logs: DayLog[];           // przycinane do 90 ostatnich dni
  version: number;          // do migracji schematu
};
```

**Przechowywanie:** `localStorage` pod jednym kluczem `pandaninja.v1`, zapis debounce'owany co 500 ms. Zero backendu, zero konta, zero internetu po pierwszym załadowaniu.

**Reset dnia:** przy każdym uruchomieniu i o północy aplikacja porównuje `date` ostatniego logu z dzisiejszą datą; jeśli się różni, tworzy nowe wpisy dnia (checki wyzerowane), a stary log ląduje w historii.

---

## 7. Stack techniczny

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | React 18 + TypeScript | znajome, dobrze wspierane przez Cursor |
| Bundler | Vite | najszybszy dev, prosty build |
| Style | Tailwind CSS | szybkie iterowanie layoutu |
| Stan | Zustand + persist middleware | 3 kB, brak boilerplate'u, wbudowany zapis do localStorage |
| Animacje | Framer Motion | animacje sprite'ów, przejścia stanów pandy |
| Dźwięk | Web Audio API (własny moduł `sfx.ts`) | zero assetów |
| Mowa | Web Speech API | wbudowany w iOS |
| PWA | `vite-plugin-pwa` | ikona na ekranie startowym, tryb pełnoekranowy, offline |
| Ekran | Screen Wake Lock API | iPad nie gaśnie w trakcie rutyny |

**Bez backendu. Bez bibliotek UI. Bez routera** (przełączanie ekranów przez stan).

---

## 8. Specyfika iPada — rzeczy, które łatwo przeoczyć

1. **Audio wymaga gestu.** Pierwszy tap na ekranie startowym musi wywołać `audioCtx.resume()` i jedno ciche `speechSynthesis.speak('')`, inaczej lektor nie odezwie się później.
2. **Aplikacja dzwoni tylko gdy jest otwarta.** PWA w tle nie odpali alarmu. Scenariusz docelowy: iPad stoi w kuchni z otwartą aplikacją i włączonym Wake Lockiem. Poranny budzik w sypialni zostaje na Zegarze iOS.
3. **Wake Lock trzeba wznawiać** po `visibilitychange` — iOS gubi blokadę przy przełączeniu aplikacji.
4. **Guided Access** (Dostęp nadzorowany, potrójne kliknięcie bocznego przycisku) zamyka dzieci w aplikacji — warto opisać to w README.
5. **Safe area** — użyć `env(safe-area-inset-*)`, żeby nic nie wpadło pod pasek domu.
6. **`user-select: none` i `-webkit-touch-callout: none`** na całej aplikacji — dziecko przytrzymujące kafel nie ma dostać menu kopiowania.
7. **Zapobiec podwójnemu tapnięciu jako zoom**: `touch-action: manipulation`.
8. **Timer musi liczyć z `Date.now()`**, nie z akumulowanych `setInterval` — iOS dławi timery w tle i minuty by uciekły.
9. **Font:** systemowy `-apple-system` dla czytelności, ale cyfry zegara z `font-variant-numeric: tabular-nums`.

---

## 9. Struktura plików

```
panda-ninja/
├── art-sheets/                 # arkusze prosto z Gemini (źródło, nie trafia do builda)
│   ├── panda-a.png  (siatka 2x2)
│   ├── panda-b.png  (siatka 2x2)
│   ├── icons.png    (siatka 6x4)
│   └── items.png    (siatka 5x3, opcjonalnie)
├── scripts/
│   ├── slice-sheets.mjs        # npm run art — tnie arkusze, usuwa tła, nazywa pliki
│   └── sheets.config.json      # opis siatek, nazwy komórek, tolerancja tła
├── public/
│   ├── manifest.webmanifest
│   ├── icons/  (192, 512, maskable)
│   └── art/
│       ├── panda-a/  sleeping.png  training.png  hurry.png  celebrating.png
│       ├── panda-b/  sleeping.png  training.png  hurry.png  celebrating.png
│       ├── items/    weapon-*.png  headband-*.png  outfit-*.png
│       └── icons/    task-*.png    (galeria ikon zadań)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── store/
│   │   ├── useStore.ts          // Zustand + persist
│   │   ├── defaults.ts          // startowa konfiguracja i lista zadań
│   │   └── selectors.ts         // wyliczenia: postęp, punkty, stan pandy
│   ├── screens/
│   │   ├── StartScreen.tsx
│   │   ├── MainScreen.tsx
│   │   ├── SummaryScreen.tsx
│   │   └── parent/
│   │       ├── PinLock.tsx
│   │       ├── ParentPanel.tsx
│   │       └── tabs/  Kids.tsx  Tasks.tsx  Timing.tsx  Rewards.tsx  Sound.tsx  History.tsx  Data.tsx
│   ├── components/
│   │   ├── ClockHeader.tsx
│   │   ├── DepartureTimeline.tsx
│   │   ├── PandaStage.tsx        // wybiera i animuje sprite
│   │   ├── KidColumn.tsx
│   │   ├── TaskTile.tsx
│   │   ├── PointsFly.tsx         // animacja "+10 ⭐"
│   │   └── FooterBar.tsx
│   ├── lib/
│   │   ├── sfx.ts                // syntezowane dźwięki
│   │   ├── speech.ts             // lektor
│   │   ├── time.ts               // okno rutyny, progi ostrzeżeń, formatowanie
│   │   ├── scoring.ts            // punkty, bonusy, seria
│   │   └── wakeLock.ts
│   └── styles/index.css
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 10. Kolejność budowy (fazy)

1. **Szkielet** — Vite + React + TS + Tailwind + Zustand, model danych, domyślna konfiguracja, ekran główny z zaślepkami zamiast grafik (kolorowe prostokąty).
2. **Logika czasu** — zegar, oś czasu, okno rutyny, progi ostrzeżeń, reset dnia o północy.
3. **Zadania i punkty** — checki, animacja punktów, bonusy, seria, zapis do logu.
4. **Panel rodzica** — PIN + wszystkie zakładki.
5. **Dźwięk i lektor** — moduł `sfx.ts`, komunikaty, testy w panelu.
6. **Grafika pand** — podmiana zaślepek na sprite'y, animacje stanów, mrugnięcie.
7. **PWA i iPad** — manifest, ikony, Wake Lock, safe area, tryb pełnoekranowy, test na urządzeniu.
8. **Podsumowanie dnia** i historia.

---

## 11. Roadmapa (poza v1)

- **Sklepik ze skinami** — ekran z listą przedmiotów (broń, opaski, kimona, tła dojo) z ceną w punktach. Dzięki warstwowej grafice nowy skin to jeden plik PNG i jeden wpis w JSON-ie, bez ruszania kodu.
- **Kreator pandy** — pełny ekran budowania postaci od zera (typ zwierzaka, kolory, imię ninja).
- **Odznaki** — „7 dni z rzędu", „Mistrz Zębów", „Ninja Śniadania".
- **Rutyna wieczorna** — ten sam silnik, inne zadania i odliczanie do „lampka gaśnie".
- **Wersja natywna** — opakowanie w Capacitora, gdyby potrzebne były prawdziwe powiadomienia w tle.
