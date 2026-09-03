# 🛠 Komplet dla Cursora — „Obowiązki Pandy Ninja"

## Zanim wkleisz cokolwiek

1. Utwórz pusty folder `panda-ninja` i otwórz go w Cursorze.
2. Wrzuć do niego trzy pliki:
   - `docs/01-PROJEKT.md` (specyfikacja),
   - `docs/makieta.html` (wizualna referencja),
   - `.cursorrules` (treść niżej).
3. Otwórz czat w trybie **Agent** i wybierz najmocniejszy dostępny model — to nie jest zadanie na autouzupełnianie.
4. Wklejaj prompty **po kolei, jeden na wiadomość**. Po każdej fazie sprawdź `npm run dev` w przeglądarce, zanim ruszysz dalej. Cursor psuje się wtedy, gdy dostaje wszystko naraz.

---

## Plik `.cursorrules`

```
Projekt: "Obowiązki Pandy Ninja" — PWA na iPada dla dwóch chłopców (6 i 8 lat),
prowadząca poranną rutynę przed wyjściem do szkoły.

STOS
- React 18 + TypeScript + Vite
- Tailwind CSS (bez bibliotek komponentów)
- Zustand z middleware persist (localStorage)
- Framer Motion do animacji
- Web Audio API do dźwięków (syntezowanych w kodzie, bez plików audio)
- Web Speech API do lektora
- vite-plugin-pwa
- ZERO backendu, ZERO zapytań sieciowych w runtime, ZERO kont użytkownika

ZASADY KODU
- TypeScript strict. Żadnego `any`.
- Cały interfejs po polsku, z polskimi znakami. Komentarze w kodzie po polsku.
- Komponenty funkcyjne, jeden komponent na plik, nazwy plików PascalCase.
- Cała logika czasu, punktacji i dźwięku mieszka w `src/lib/` i jest czystymi
  funkcjami — komponenty tylko renderują.
- Stan globalny wyłącznie w Zustandzie; żadnego prop-drillingu przez 3 poziomy.
- Żadnych magicznych liczb w JSX — stałe do `src/lib/constants.ts`.

ZASADY UI (aplikacja dla dzieci na dotykowym ekranie)
- Minimalny obszar dotyku 72 px wysokości. Cały kafel jest klikalny, nie sam checkbox.
- Font bazowy 18 px, zegar minimum 96 px, `font-variant-numeric: tabular-nums`.
- Kontrast tekstu min. 4.5:1.
- `user-select:none`, `-webkit-touch-callout:none`, `touch-action:manipulation` globalnie.
- Respektuj `env(safe-area-inset-*)`.
- Działa w orientacji pionowej (główna) i poziomej.
- Żadnych okien `alert`, `confirm`, `prompt` — własne modale.

ZASADY iOS/iPad (krytyczne)
- Odliczanie czasu ZAWSZE z `Date.now()`, nigdy z akumulowanego `setInterval`.
- Audio i mowę odblokuj pierwszym gestem użytkownika na ekranie startowym.
- Wake Lock wznawiaj po zdarzeniu `visibilitychange`.
- Aplikacja musi działać w 100% offline po pierwszym załadowaniu.

CZEGO NIE ROBIĆ
- Nie dodawaj bibliotek spoza listy bez pytania.
- Nie twórz backendu, API, bazy ani logowania.
- Nie wprowadzaj kar, smutnych min, rankingów ani porównań między dziećmi.
- Nie generuj grafiki — użyj kolorowych zaślepek, pliki PNG dojdą później.
```

---

## PROMPT 1 — Szkielet i model danych

> Przeczytaj `docs/01-PROJEKT.md` w całości oraz `.cursorrules`. Otwórz też `docs/makieta.html` — to jest wizualna referencja układu, kolorystyki i zachowania interfejsu, ale ma być przepisana na React, a nie skopiowana.
>
> Zbuduj szkielet projektu:
> - Vite + React 18 + TypeScript (strict) + Tailwind CSS + Zustand + Framer Motion + vite-plugin-pwa.
> - Pełną strukturę folderów z sekcji 9 specyfikacji — utwórz wszystkie pliki, na razie mogą być puste komponenty zwracające zaślepkę.
> - `src/types.ts` z dokładnie tymi typami, które są w sekcji 6 specyfikacji.
> - `src/store/useStore.ts` — Zustand z `persist` pod kluczem `pandaninja.v1`, z polem `version` i zaczątkiem funkcji migracji.
> - `src/store/defaults.ts` — startowy stan: dwoje dzieci o imionach „Syn 1" i „Syn 2" (imiona zmienia się w panelu rodzica), po 7 domyślnych zadań każde (Wstać, Ubranie, Śniadanie, Zęby, Uczesać się, Plecak, Buty), godzina wyjścia 07:40 pon–pt, weekend wyłączony, PIN „1111", ostrzeżenia [20,10,5,0], okno rutyny 90 minut.
> - `src/lib/constants.ts` z paletą kolorów i wymiarami.
>
> Na koniec: `npm run dev` ma wstawać bez błędów i pokazywać pustą aplikację z nagłówkiem. Napisz mi w odpowiedzi, jakie komendy mam uruchomić.

---

## PROMPT 2 — Logika czasu i oś do wyjścia

> Zaimplementuj `src/lib/time.ts` i komponenty `ClockHeader.tsx` oraz `DepartureTimeline.tsx` zgodnie z sekcją 2 specyfikacji (Strefa 1).
>
> `src/lib/time.ts` — czyste funkcje, w pełni testowalne:
> - `getDepartureToday(settings, now): Date | null`
> - `getRoutinePhase(now, departure, windowMin)` → `'before' | 'active' | 'past'`
> - `getProgress(now, departure, windowMin)` → 0–1
> - `getMinutesLeft(now, departure)` → liczba
> - `getTimelineColor(ratio)` → `'green' | 'amber' | 'red'` (progi: >0.5, 0.5–0.2, <0.2)
> - `formatCountdown(minutes)` → „Zostało 28 minut" / „Ostatnie 5 minut!" / „Czas wychodzić!" / „Do wyjścia: 3 godz 12 min"
>
> Wymagania:
> - Tik co sekundę hookiem `useNow()`, który liczy z `Date.now()`, nigdy nie akumuluje.
> - Gdy do wyjścia jest więcej niż okno rutyny (domyślnie 90 min) — pasek wygaszony, tekst „Do wyjścia: X godz Y min", pandy śpią. Bez presji.
> - Znaczniki ostrzeżeń narysowane na pasku w odpowiednich pozycjach procentowych.
> - Wykrywanie zmiany doby: jeśli data ostatniego logu ≠ dzisiejsza, wyzeruj checki i zapisz stary dzień do historii. Sprawdzaj przy starcie i przy każdym tiknięciu minuty.
>
> Dopisz test jednostkowy (Vitest) dla wszystkich funkcji z `time.ts`, w szczególności dla przypadków granicznych: dokładnie w momencie wyjścia, minutę po, dzień bez ustawionej godziny wyjścia, przekroczenie północy.

---

## PROMPT 3 — Zadania, punkty, ekran główny

> Zbuduj ekran główny: `MainScreen.tsx`, `KidColumn.tsx`, `TaskTile.tsx`, `PandaStage.tsx` (na razie kolorowy prostokąt z nazwą stanu zamiast grafiki), `PointsFly.tsx`, `FooterBar.tsx`. Układ dokładnie jak w sekcji 2 specyfikacji i jak w `docs/makieta.html`.
>
> `src/lib/scoring.ts`:
> - punkty za zadanie z jego wagi,
> - bonus za komplet własnej listy (+20), bonus wspólny gdy obie listy gotowe przed wyjściem (+50 każdemu), bonus za tempo gdy komplet ≥10 min przed wyjściem (+15),
> - seria dni: rośnie przy komplecie w dzień szkolny, zeruje się przy niekomplecie, nigdy nie odbiera punktów,
> - punkty tygodniowe (pon–nd) liczone z logów, osobno od bezterminowego konta.
>
> Zachowanie kafla zadania:
> - tap = odhaczenie: zapis do stanu, animacja „+10 ⭐" lecąca do licznika, mikro-reakcja pandy,
> - odhaczone kafle przechodzą na dół listy z wygaszonym stylem, ale nie znikają,
> - odznaczenie tylko po przytrzymaniu 1 sekundy (z wizualnym paskiem postępu przytrzymania),
> - zadania filtrowane po dniu tygodnia (`days`).
>
> Stan pandy wyliczany selektorem: `sleeping` / `training` / `hurry` / `celebrating` — reguły w tabeli w sekcji 2 specyfikacji.

---

## PROMPT 4 — Panel rodzica

> Zbuduj panel rodzica zgodnie z sekcją 3.3 specyfikacji: `PinLock.tsx`, `ParentPanel.tsx` i siedem zakładek.
>
> - `PinLock`: pełnoekranowa klawiatura numeryczna, 4 cyfry, kropki zamiast cyfr, wstrząs przy błędzie, po 5 błędach blokada na 60 sekund. PIN z ustawień.
> - **Dzieci**: imię (input tekstowy), wybór broni / opaski / kimona / koloru akcentu z siatki kafli, reset punktów z potwierdzeniem.
> - **Zadania**: osobno dla każdego dziecka — dodaj / edytuj / usuń, zmiana kolejności przeciąganiem (dotykowo, użyj `dnd-kit` jeśli musisz dodać bibliotekę — najpierw mnie zapytaj), wybór ikony z galerii, liczba punktów, przełączniki dni tygodnia, przycisk „skopiuj listę do drugiego dziecka".
> - **Czas**: godzina wyjścia osobno na każdy dzień pon–nd (dzień można wyłączyć), szerokość okna rutyny, minuty ostrzeżeń.
> - **Nagrody**: nazwa nagrody tygodniowej + próg punktowy, plus pole na nagrodę specjalną.
> - **Dźwięk**: suwak głośności, przełącznik lektora, lista polskich głosów systemowych, przycisk testu każdego dźwięku, edytowalne teksty komunikatów lektora.
> - **Historia**: tabela ostatnich 30 dni + eksport CSV.
> - **Dane**: eksport i import całego stanu jako plik JSON.
>
> Wszystko po polsku, wszystko z klawiaturą ekranową na uwadze (pola nie mogą chować się pod klawiaturą iPada).

---

## PROMPT 5 — Dźwięk i lektor

> Zaimplementuj `src/lib/sfx.ts` i `src/lib/speech.ts` zgodnie z sekcją 5 specyfikacji.
>
> `sfx.ts` — wszystkie dźwięki **syntezowane** przez Web Audio API, żadnych plików:
> - `chime()` — dwutonowy dzwonek 880→1320 Hz, 180 ms, przy odhaczeniu,
> - `unchime()` — cichy krótki „puf" przy odznaczeniu,
> - `gong()` — niski oscylator z długim wybrzmieniem, przy starcie okna rutyny,
> - `taiko(n)` — n uderzeń bębna (szum przepuszczony przez filtr dolnoprzepustowy z szybką obwiednią), na ostrzeżenia,
> - `fanfare()` — wznoszące arpeggio pięciu nut, przy komplecie,
> - `victory()` — fanfara + podwójne taiko, przy bonusie wspólnym.
> Wszystko przez jeden współdzielony `AudioContext`, z master gainem sterowanym głośnością z ustawień i globalnym wyciszeniem.
>
> `speech.ts` — Web Speech API, głos `pl-PL`, teksty brane z `settings.voiceLines`, kolejkowanie wypowiedzi (nigdy dwie naraz), łagodne pominięcie gdy API niedostępne.
>
> Harmonogram ostrzeżeń: przy każdym tiknięciu minuty sprawdź, czy `minutesLeft` jest w tablicy `warningsMin` i czy to ostrzeżenie nie zostało już dziś odegrane (flaga w stanie dnia, żeby nie powtarzać po odświeżeniu strony).
>
> Dodaj `StartScreen.tsx` — ekran „🥋 Zaczynamy trening!", którego tapnięcie robi `audioCtx.resume()` i puste `speechSynthesis.speak('')`, a potem włącza Wake Lock. Bez tego iOS nie odezwie się później.

---

## PROMPT 6a — Skrypt tnący arkusze graficzne

> Grafiki przychodzą z Gemini jako **arkusze** — jeden plik z siatką postaci lub ikon. Napisz skrypt, który je pokroi, tak żebym nigdy nie musiał nic wycinać ręcznie.
>
> Utwórz `scripts/slice-sheets.mjs` (Node, biblioteka `sharp` jako devDependency) oraz `scripts/sheets.config.json`. Podepnij pod `npm run art`.
>
> Konfiguracja opisuje arkusze deklaratywnie — dodanie nowego arkusza ma nie wymagać ruszania kodu:
> ```json
> {
>   "bgColor": "#F2F2F2",
>   "tolerance": 18,
>   "sheets": [
>     { "src": "art-sheets/panda-a.png", "cols": 2, "rows": 2, "out": "public/art/panda-a",
>       "size": 512, "align": "bottom",
>       "names": ["sleeping", "training", "hurry", "celebrating"] },
>     { "src": "art-sheets/panda-b.png", "cols": 2, "rows": 2, "out": "public/art/panda-b",
>       "size": 512, "align": "bottom",
>       "names": ["sleeping", "training", "hurry", "celebrating"] },
>     { "src": "art-sheets/icons.png", "cols": 6, "rows": 4, "out": "public/art/icons",
>       "size": 128, "align": "center", "prefix": "task-",
>       "names": ["bed","clothes","shirt","cereal","milk","toothbrush",
>                 "hairbrush","soap","toilet","backpack","lunchbox","notebook",
>                 "book","shoes","jacket","cap","bottle","dogbowl",
>                 "plant","toys","dishes","curtains","keys","clock"] },
>     { "src": "art-sheets/items.png", "cols": 5, "rows": 3, "out": "public/art/items",
>       "size": 256, "align": "center",
>       "names": ["weapon-bo","weapon-katana","weapon-nunchaku","weapon-kama","weapon-shuriken",
>                 "headband-white","headband-red","headband-blue","headband-green","headband-black",
>                 "outfit-charcoal","outfit-indigo","outfit-crimson","outfit-forest","weapon-sai"] }
>   ]
> }
> ```
>
> Co robi skrypt dla każdego arkusza:
> 1. Wczytuje obraz, dzieli na `cols × rows` równych komórek.
> 2. **Usuwa tło**: wypełnianie powodziowe (flood fill) startujące z czterech rogów komórki, z tolerancją koloru `tolerance` w przestrzeni RGB. Piksele tła → alfa 0. Ważne: fill musi być powodziowy, a nie zwykłe „zamień kolor" — inaczej wygryzie jasne miejsca wewnątrz postaci (białe futro pandy!).
> 3. Wygładza krawędź alfy o 1 px, żeby nie było poszarpanych schodków.
> 4. Przycina puste marginesy (`trim`).
> 5. Wpasowuje w kwadrat `size × size` z 6% marginesem. Przy `align: "bottom"` wszystkie komórki arkusza dostają **wspólną linię podłoża** — wyliczoną z najwyższej postaci w arkuszu — żeby pandy nie skakały w pionie przy zmianie stanu. Przy `align: "center"` — wyśrodkowanie.
> 6. Zapisuje PNG z kanałem alfa jako `<out>/<prefix><name>.png`.
>
> Wymagania dodatkowe:
> - Brakujący arkusz = ostrzeżenie i pominięcie, nie wywalenie skryptu. Chcę móc mieć tylko `panda-a.png` i to ma zadziałać.
> - Liczba nazw krótsza niż liczba komórek = tnij tylko tyle, ile jest nazw.
> - Na koniec wypisz podsumowanie: ile plików zapisano, do jakich folderów, i ostrzeż o każdej komórce, która po przycięciu wyszła podejrzanie mała (<20% wysokości komórki) — to znak, że Gemini narysował coś nie tam, gdzie trzeba.
> - Dopisz w `README.md` sekcję „Podmiana grafik": wrzuć plik do `art-sheets/`, odpal `npm run art`, gotowe.

---

## PROMPT 6b — Grafika pand w interfejsie

> Podmień zaślepki w `PandaStage.tsx` na prawdziwe obrazy. Pliki są wynikiem `npm run art` i leżą w `public/art/panda-a/` i `public/art/panda-b/`, po cztery na pandę: `sleeping.png`, `training.png`, `hurry.png`, `celebrating.png`.
>
> - Ładowanie z podmianą krzyżową (cross-fade 250 ms) przy zmianie stanu, przez Framer Motion.
> - Wszystkie cztery obrazy preładuj przy starcie, żeby zmiana stanu nie migała.
> - Jeśli pliku brakuje — pokaż dotychczasową zaślepkę zamiast zepsutej ikonki. Aplikacja musi działać z niekompletnym zestawem grafik.
> - Animacje per stan: `sleeping` — powolne „oddychanie" (scale 1 ↔ 1.025, 3.6 s); `training` — delikatne podskakiwanie (7 px, 1.6 s); `hurry` — to samo, ale 0.55 s; `celebrating` — skok 18 px z lekkim obrotem plus rozsypane gwiazdki.
> - Nad śpiącą pandą unoszące się „zZz".
> - Respektuj `prefers-reduced-motion`.

---

## PROMPT 7 — PWA i dopieszczenie iPada

> Dokończ warstwę PWA i zachowanie na iPadzie:
> - `manifest.webmanifest`: nazwa „Panda Ninja", `display: standalone`, `orientation: any`, kolor tła `#F3F1EC`, ikony 192/512 + maskable z `public/icons/`.
> - `vite-plugin-pwa` z workboxem cache'ującym wszystko — aplikacja ma działać w trybie samolotowym.
> - `src/lib/wakeLock.ts` — Screen Wake Lock aktywny w trakcie okna rutyny, wznawiany po `visibilitychange`, zwalniany po godzinie wyjścia. Łagodne pominięcie tam, gdzie API nie istnieje.
> - Meta tagi Apple: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`.
> - Globalny CSS: `user-select:none`, `-webkit-touch-callout:none`, `touch-action:manipulation`, `overscroll-behavior:none`, obsługa `env(safe-area-inset-*)`.
> - Sprawdź układ w orientacji poziomej: pandy po lewej jedna nad drugą, listy zadań po prawej w dwóch kolumnach.
> - Napisz `README.md` po polsku: instalacja, uruchomienie, jak dodać na ekran startowy iPada, jak włączyć Dostęp nadzorowany (Guided Access), gdzie wrzucić grafiki, jak zrobić backup danych.

---

## PROMPT 8 — Podsumowanie dnia i historia

> Zbuduj `SummaryScreen.tsx` zgodnie z sekcją 3.2 specyfikacji. Odpala się automatycznie w momencie godziny wyjścia, pokazuje się 3 minuty, potem wraca do ekranu głównego (można też zamknąć tapnięciem).
>
> Zawartość: wynik punktowy każdego dziecka („60 z 90 punktów"), nowy stan konta, seria dni, postęp do nagrody tygodniowej, jedno zdanie zamykające.
>
> **Ton jest krytyczny:** żadnej kary, żadnej smutnej pandy, żadnego porównywania braci. Przy słabszym wyniku: „Jutro damy radę!". Przy komplecie: „Perfekcyjny trening!". Nawet przy zerze na liście podsumowanie ma być życzliwe.
>
> Zapisz dzień do `logs`, przytnij historię do 90 ostatnich dni.

---

## PROMPT 9 — Przegląd końcowy

> Zrób przegląd całego kodu pod kątem tej listy i napraw, co znajdziesz:
> 1. Czy jakikolwiek timer akumuluje czas zamiast liczyć z `Date.now()`?
> 2. Czy aplikacja przetrwa: odświeżenie strony w środku rutyny, przejście przez północ przy otwartej aplikacji, zmianę czasu letni/zimowy, dzień bez ustawionej godziny wyjścia?
> 3. Czy każde ostrzeżenie dźwiękowe odgrywa się dokładnie raz dziennie, także po przeładowaniu strony?
> 4. Czy da się zepsuć stan przez szybkie wielokrotne tapnięcia w kafel?
> 5. Czy dziecko może przypadkiem wejść do panelu rodzica lub skasować dane?
> 6. Czy jest gdziekolwiek `any`, `alert()`, `confirm()` albo zapytanie sieciowe?
> 7. Czy aplikacja działa przy pustym `localStorage` i przy `localStorage` z poprzedniej wersji schematu?
>
> Wypisz mi listę tego, co poprawiłeś, i osobno listę rzeczy, o których musisz mnie zapytać.

---

## Prompty ratunkowe (gdy coś nie działa)

**Brak dźwięku na iPadzie:**
> Dźwięk nie odtwarza się na iPadzie, choć na Macu/PC działa. Sprawdź, czy `AudioContext` jest tworzony i wznawiany dokładnie w handlerze gestu użytkownika, czy nie jest tworzony wcześniej przy imporcie modułu, oraz czy `speechSynthesis` dostał pierwsze puste wywołanie w tym samym geście. Popraw i wyjaśnij, co było nie tak.

**Zegar rozjeżdża się po odblokowaniu iPada:**
> Po zablokowaniu i odblokowaniu iPada zegar pokazuje złą godzinę. Znajdź wszystkie miejsca, gdzie czas jest akumulowany zamiast czytany z `Date.now()`, i przepisz je. Dodaj też przeliczenie stanu przy zdarzeniu `visibilitychange`.

**Layout nie mieści się na ekranie:**
> Na iPadzie [model] w orientacji [pionowej/poziomej] lista zadań ucieka poza ekran. Przerób układ na `dvh` i flexa z `min-height: 0` na kontenerach scrollowanych, tak żeby nagłówek i stopka były zawsze widoczne, a scrollowały się wyłącznie listy zadań.

---

## Co sprawdzić po zbudowaniu (test odbioru)

- [ ] Otwarcie aplikacji o 5:00 rano nie pokazuje presji — pasek wygaszony, „Do wyjścia: 2 godz 40 min", pandy śpią.
- [ ] Odhaczenie zadania: dźwięk, animacja punktów, panda budzi się do stanu `training`.
- [ ] O T-10 leci komunikat lektora. Odświeżenie strony nie powtarza go.
- [ ] Komplet obu list → fanfara, bonus wspólny, obie pandy świętują.
- [ ] O godzinie wyjścia pojawia się podsumowanie, po 3 minutach znika.
- [ ] Następnego dnia checki są wyzerowane, punkty i seria zachowane.
- [ ] Panel rodzica nie do przejścia bez PIN-u; dziecko nie kasuje danych.
- [ ] Tryb samolotowy: aplikacja startuje i działa w całości.
- [ ] Dodana na ekran startowy iPada otwiera się bez paska adresu.
- [ ] Wersja bez grafik (puste `public/art/`) nadal działa.
