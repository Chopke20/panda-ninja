# Kotwice — jak paper-doll składa się dzisiaj

Status: **kanoniczny opis silnika**. `05-WDROZENIE-ART.md` = plan i budżet assetów,
`06-COMFYUI.md` = kiedy w ogóle sięgać po generator.

---

## 1. Co było zepsute

Generator (Cursor / Gemini) rysował każdą warstwę na pełną klatkę 512×512 —
plecak wypełniał kadr, pięść wypełniała kadr, kij wypełniał kadr po przekątnej.
Composer stackował te pliki 1:1 (`lockFrame`), więc na pandzie wielkości pandy
lądowała pięść wielkości pandy.

Wniosek z 2026-09-05 („bez ControlNet warstwy się nie złożą") był postawiony na
złym założeniu: że warstwa musi mieć **ten sam kadr** co body. Nie musi.
Wystarczy, że przedmiot jest ładnie narysowany **sam z siebie** — kadr i tak
zostaje wyrzucony przy przycinaniu do bbox.

Przedmioty z generatora są dobre. Zepsute było sadzanie.

---

## 2. Jak jest teraz

```
warstwa PNG  →  przytnij do bbox  →  posadź na kotwicy pozy  →  <img>
```

1. **`npm run art:anchor`** przycina każdą warstwę (dłonie, bronie, gadżety,
   logo, aury) do bbox alfy. Broniom „kijowym" dodatkowo obraca oś główną do
   poziomu, żeby rotację ustawiała poza, a nie przypadkowy kadr generatora.
   Arkusz dłoni rozbija na osobne pięści: `<pose>-l.png`, `<pose>-r.png`,
   `<pose>-solo.png` (gdy pięści są zlepione w jedną plamę, tnie w najwęższym
   miejscu).
2. **`src/data/panda-anchors.json`** trzyma kotwice: gdzie są dłonie, gdzie
   płytka opaski, gdzie twarz, plecy i pas — w % płótna, per poza.
3. **`src/lib/pandaAnchors.ts`** liczy z tego `Placement { x, y, w, rotate }`.
4. **`PandaComposer`** renderuje `width: w%`, `height: auto` — proporcje
   przedmiotu bierze przeglądarka z samego pliku, więc nie trzeba żadnego
   manifestu rozmiarów w runtime.

Skalowanie broni idzie z **rozstawu rąk** (`grip.span`), nie ze stałej liczby.
Dlatego kij w pozie `celebrating` (ręce w górze, rozstaw 63%) jest dłuższy niż
w `sleeping` (ręce na kolanach, rozstaw 39%) — bez osobnych plików.

`hurry` ma jedną widoczną rękę: `handOff` jest `null`, więc leci sama pięść
`-solo` i żadna druga dłoń nie wisi w powietrzu.

---

## 3. Kolory bez AI

Maski kimona i opaski są liczone **z rysunku body** przez `npm run art:masks`:

- **kimono** — flood fill od kilku ziaren w tułowiu, nogawkach i rękawach,
  ograniczony luminancją (26–150), więc biały pysk i jasna opaska nie wpadają
  do środka. Czarne kontury zostają poza maską i dlatego przeżywają
  przemalowanie.
- **opaska** — jasne komponenty w boxie wokół głowy, tylko te **szerokie i
  płaskie** (proporcja ≥ 1.6). Pysk odpada sam, bo jest okrągły.

Do każdej maski leci `shade` — znormalizowana luminancja regionu. W CSS:

```
płaski kolor (mask-image)  →  shade z mix-blend-mode: multiply
```

czyli kolor razy własne fałdy tkaniny. Bez tego czerwone kimono byłoby płaską
czerwoną plamą.

Ziarna i boxy siedzą w tym samym `panda-anchors.json` (sekcja `masks`).
Jeśli kiedyś zmieni się master body, poprawia się ziarna, nie maski.

---

## 4. Druga sylwetka (agile)

`agile` = `round` zwężony o `bodies.agile.sx` (0.88), wyrównany do dołu.
Zwężane jest **tylko body**; reszta warstw jest kopiowana 1:1, bo pozycję i
rozmiar liczy kotwica, która ten sam współczynnik już zna. Skalowanie plików
i kotwic naraz zwężałoby wszystko dwa razy.

---

## 5. Kolejność w `npm run art:v2`

```
art            tnie arkusze z art-sheets/
art:postprocess maski/gadżety z arkuszy (klucz koloru #F2F2F2)
art:agile      body round → body agile (zwężone), reszta 1:1
art:masks      maski + shade kimona i opaski z body
art:anchor     przycięcie do bbox, oś broni, rozbicie pięści
art:thumbs     miniatury sklepu 128 px
art:webp       WebP obok PNG
art:validate   92/92 na sylwetkę, zapis status.json
```

`art:anchor` jest **idempotentny** — plik już ciasny (bbox == cała klatka) jest
pomijany, więc powtórne odpalenie nie obcina niczego drugi raz.

---

## 6. QA bez klikania w apce

```bash
npm run art:sheet            # round
npm run art:sheet -- agile
```

Kontaktówka `art-qa/contact-<body>.png`: 9 broni × 4 pozy, z kolorami, logo i
gadżetami. Składa je ten sam plik kotwic co aplikacja, więc jeśli coś siedzi
krzywo na kontaktówce, będzie krzywo i na iPadzie.

`art-qa/` jest w `.gitignore`.

---

## 7. Strojenie

Wszystko jest w `src/data/panda-anchors.json`:

| Chcę | Zmieniam |
| --- | --- |
| broń wyżej / niżej w dłoniach | `anchors.<poza>.grip.y` |
| broń pod innym kątem | `anchors.<poza>.grip.angle` |
| dłuższy / krótszy kij | `slots.weaponStaff.wFromSpan` |
| większe pięści | `slots.fist.w` |
| plecak wyżej i szerszy | `anchors.<poza>.back` |
| jeden przedmiot inaczej niż reszta | `items.<assetKey>` → `wMul`, `dx`, `dy`, `rotate` |
| broń, której nie wolno obracać | `items.<assetKey>.normalizeAxis: false` |

Po zmianie kotwic **nie trzeba** przepuszczać grafiki przez pipeline — to jest
tylko matematyka w runtime. Wystarczy `npm run art:sheet`, żeby zobaczyć efekt.

Po zmianie `masks` (ziarna) trzeba `npm run art:masks && npm run art:webp`.

---

## 8. Czego to nie naprawia

- **Styl niektórych gadżetów.** Okulary wyszły bardziej steampunkowe niż reszta
  dojo. Kotwica postawi je na oczach, ale ich nie przerysuje.
- **Peleryna** ma białą podszewkę, która w `sleeping` wygląda jak chusta.
- **`agile` to wciąż tylko węższy `round`** — nie inna sylwetka. Dzieciak
  zauważy, że brat to ta sama panda na diecie.
- **Nowe pozy** (np. prawdziwy chwyt dwuręczny pod kątem) wymagają nowego body.

To są jedyne miejsca, gdzie generator obrazów jeszcze coś wnosi — patrz
`06-COMFYUI.md`.
