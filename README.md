# Obowiązki Pandy Ninja

PWA na iPada: poranna i wieczorna rutyna dwóch synów (6 i 8 lat) jako trening w dojo. Zero backendu, zero kont, działa offline po pierwszym załadowaniu.

## Dwie rutyny

Na ekranie głównym jest przełącznik **Poranek / Wieczór**. Każda rutyna ma własną listę zadań i własny wpis w historii dnia.

- **Poranek** — odliczanie do godziny wyjścia, gongi ostrzeżeń, seria 🔥 liczy się tylko tutaj.
- **Wieczór** — odliczanie do godziny snu, bez gongów i bez pośpiechu.

Zadanie może mieć **spokojny timer** (np. zęby 2 min, książka 5 min): dziecko klika Start, czas leci z `Date.now()`, na końcu jest miękki dźwięk i pochwała. Nie ma przegranej — kafel można odhaczyć w dowolnym momencie, także bez uruchamiania timera.

Godziny wyjścia i snu na każdy dzień tygodnia ustawia się w panelu rodzica → **Czas**. Zadania i timery → zakładka **Zadania** (filtr Poranek / Wieczór).

## Uruchomienie

```bash
npm install
npm run art
npm run dev
```

Aplikacja wstaje na [http://localhost:5173](http://localhost:5173). Na iPadzie w tej samej sieci Wi‑Fi otwórz adres z terminala (np. `http://192.168.x.x:5173`).

Build produkcyjny (ten wrzucasz na iPada na stałe):

```bash
npm run build
npm run preview
```

## Instalacja na iPadzie

1. Otwórz aplikację w **Safari** (nie w Chrome).
2. Udostępnij → **Dodaj do ekranu początkowego**.
3. Uruchom z ikony — tryb pełnoekranowy, bez paska adresu.
4. Włącz **Dostęp nadzorowany** (Guided Access):
   - Ustawienia → Dostępność → Dostęp nadzorowany → włącz.
   - Ustaw kod (inny niż PIN `1111` w aplikacji).
   - Otwórz Pandę Ninja, potem **trzykrotnie kliknij przycisk boczny**.
   - Wyłącz przyciski fizyczne i ewentualnie dotyk poza ekranem.
   - Dziecko nie wyjdzie do Safari ani do innych aplikacji.

Aplikacja trzyma ekran włączony tylko w oknie porannej rutyny. Budzik zostaje na Zegarze iOS.

## Podmiana grafik

Wrzuć arkusz do `art-sheets/` (`panda-a.png`, `panda-b.png`, `icons.png`, `items.png`) i odpal:

```bash
npm run art
```

Skrypt tnie siatkę, usuwa tło powodziowo (nie wygryza białego futra) i zapisuje PNG do `public/art/`. Brakujący arkusz jest pomijany. Aplikacja działa też bez grafik — wtedy widać kolorowe zaślepki.

Siatki są zapisane w `scripts/sheets.config.json` i muszą się zgadzać z arkuszem:

| Arkusz | Siatka | Zawartość |
| --- | --- | --- |
| `panda-a.png` | 2 × 2 | sleeping, training, hurry, celebrating |
| `panda-b.png` | 2 × 2 | to samo, druga sylwetka |
| `icons.png` | 6 × 5 | 30 ikon zadań |
| `items.png` | 5 × 3 | 15 przedmiotów sklepiku |

Czego arkusz **nie** może zawierać, bo aplikacja dokłada to sama i wyjdzie podwójnie:

- gwiazdek, konfetti i błysków przy pozie `celebrating`;
- literek „Z” przy pozie `sleeping`;
- cieni rzucanych pod przedmiotami w `items.png` (zostają jako brudne smugi po wycięciu).

Tło każdego pola musi być jednolite `#F2F2F2` — po tym kolorze skrypt rozpoznaje, co usunąć.

Ikony PWA leżą w `public/icons/` (192, 512, maskable, apple-touch).

## Backup danych

W panelu rodzica (ikona ⚙, PIN domyślnie `1111`) zakładka **Dane**:

- **Eksport JSON** — kopia dzieci, zadań, ustawień i historii. Zrób ją przed czyszczeniem pamięci Safari.
- **Import JSON** — wgrywa kopię (z potwierdzeniem).
- Zakładka **Historia** eksportuje CSV z ostatniego roku.

Safari bywa agresywna przy braku miejsca — backup na Macu lub w Plikach iPada jest ważny.

## Tryb samolotowy

Po jednym załadowaniu (najlepiej po `npm run build` / instalacji na ekran startowy) aplikacja nie potrzebuje sieci. Dźwięki są syntezowane, lektor jest systemowy, stan siedzi w `localStorage` pod kluczem `pandaninja.v1`.

## Stos

React 18, TypeScript strict, Vite, Tailwind, Zustand, Framer Motion, Web Audio API, Web Speech API, vite-plugin-pwa.
