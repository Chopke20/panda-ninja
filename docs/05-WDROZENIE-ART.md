# Plan wdrożenia skór, sklepiku i generacji grafiki

Status: **kanoniczny plan**.  
`docs/04-PANDA-CUSTOMIZATION.md` = stary szkic koncepcji; przy konflikcie wygrywa ten plik.

Cel: sklepik naprawdę zmienia wygląd pandy (broń, gadżety, kolory, logo) w 4 pozach, offline na iPadzie, bez 3D i bez magicznego „doklej dowolną broń do jednej pięści”.

---

## 1. Decyzja architektoniczna

### Robimy: paper-doll + rodziny chwytu

Panda = stos warstw na wspólnym płótnie **512 × 512**:

```
aura
→ back (plecak / peleryna)
→ body (futro + twarz, bez broni)
→ kimono-mask + kimono-shade
→ headband-mask + headband-shade
→ weapon-back          (opcjonalnie, gdy broń przechodzi za tułowiem)
→ hands                (osobna warstwa rodziny chwytu)
→ weapon-front
→ head (okulary / maska / chusta)
→ logo (znak na płytce)
→ belt (sakiewka / butelka)
→ efekty UI (gwiazdki, Zzz — tylko w kodzie, nie w PNG)
```

### Nie robimy

| Pomysł | Powód |
| --- | --- |
| Jedna pięść + dowolna broń obracana w CSS | działa tylko dla kijów; nunchaku/sai/wachlarz się rozsypią |
| Pełna macierz wszystkich kombinacji wypalonych | eksplozja plików i kosztów |
| 3D / Live2D w PWA | za ciężkie, inna estetyka, nowa biblioteka |
| Gemini jako jedyne źródło produkcji | słaba spójność pikseli między warstwami |
| Emoji zamiast gadżetów w końcowym produkcie | sklepik ma wyglądać jak grafika, nie jak klawiatura |

### Rodziny chwytu

| Rodzina | Bronie sklepiku | Układ dłoni (osobna warstwa × 4 pozy) |
| --- | --- | --- |
| `empty` | bez broni / sleeping | dłonie otwarte lub luźne pięści, bez dziury na kij |
| `staff` | bo, bokken, kostur, naginata, złoty kij | obie ręce na **jednym** uchwycie, pięści jedna nad drugą / wzdłuż kija |
| `dual` | nunchaku, sai, pałeczki | **dwie** krótkie rękojeści — lewa i prawa dłoń osobno, nie ten sam gest co staff |
| `fan` | wachlarz | jedna dłoń trzyma wachlarz z boku / przed sobą, druga wolna lub wspiera |

**Zasada produkcyjna:** body jest **bez dłoni** (rękawy kończą się na nadgarstku).  
Każda rodzina ma własny arkusz dłoni. **Zakaz** kopiowania układu `staff` na `dual` / `fan`.

W katalogu każda broń ma `gripFamily`. Zmiana broni w rodzinie `staff` = podmiana PNG przedmiotu, te same dłonie staff.  
Zmiana na nunchaku = inne dłonie (`dual`), nie obrót kija.

---

## 2. Efekt końcowy (definition of done)

Dziecko w sklepiku:

1. Zakłada **inną broń** → widać inną broń w dłoniach we wszystkich 4 pozach.
2. Zakłada **plecak / okulary / pelerynę** → widać na pandzie, nie emoji.
3. Zmienia **kolor kimona / opaski** → widać realną zmianę koloru (maska), nie plamę multiply.
4. Zmienia **logo** → znak na płytce opaski.
5. Druga sylwetka (panda-b) działa tak samo.
6. Brak podwójnej broni, brak wypalonych gwiazdek/Zzz w assetach.
7. Aplikacja nadal 100% offline po pierwszym załadowaniu.

---

## 3. Struktura plików `panda-v2`

```
public/art/panda-v2/
  round/                          # body: round = panda-a
    body/{sleeping,training,hurry,celebrating}.webp
    hands/
      staff/{...4 pozy...}.webp
      dual/{...}.webp
      fan/{...}.webp
      empty/{...}.webp
    kimono/
      mask/{...4...}.webp
      shade/{...4...}.webp
    headband/
      mask/{...4...}.webp
      shade/{...4...}.webp
    weapons/
      bo/{...4...}.webp
      bokken/{...4...}.webp
      dragon-staff/{...4...}.webp
      naginata/{...4...}.webp
      master/{...4...}.webp
      nunchaku/{...4...}.webp
      sai/{...4...}.webp
      sticks/{...4...}.webp
      fan/{...4...}.webp
    gadgets/
      pack/{...4...}.webp
      dragon-pack/{...4...}.webp
      cape/{...4...}.webp
      glasses/{...4...}.webp
      mask/{...4...}.webp
      scarf/{...4...}.webp
      bottle/{...4...}.webp
      pouch/{...4...}.webp
      talisman/{...4...}.webp
    logos/{paw,bamboo,mountain,wave,moon,bolt,dragon,star}.webp
    shop/
      weapons/*.webp              # miniatury 128×128
      gadgets/*.webp
  agile/                          # body: agile = panda-b (faza 2)
    ...ta sama struktura...
```

Manifest JSON (`public/art/panda-v2/manifest.json`): lista wymaganych ścieżek + `gripFamily` + bbox dłoni per poza (opcjonalnie do debugu).

Runtime przełącza się na v2 dopiero gdy `npm run art:validate` przejdzie dla **co najmniej** `round` + rodzina `staff` + maski koloru + 2 gadżety.

Do czasu przełączenia: obecne flat `panda-a` / `panda-b` jako fallback.

---

## 4. Budżet assetów (efekt vs koszt)

### Faza 1 — MVP „sklepik działa” (jedna sylwetka `round`)

| Warstwa | Liczba PNG |
| --- | --- |
| body × 4 | 4 |
| hands staff × 4 + empty × 4 | 8 |
| kimono mask+shade × 4 | 8 |
| headband mask+shade × 4 | 8 |
| bronie staff × 5 × 4 | 20 |
| gadżety × 3 (pack, glasses, cape) × 4 | 12 |
| logo × 8 | 8 |
| miniatury sklepowe | ~15 |
| **Razem** | **≈ 80–85** |

To wystarczy, by broń, kolor, logo i 3 gadżety były prawdziwe.

### Faza 2 — pełny sklepik + brat

- rodziny `dual` + `fan`
- pozostałe gadżety
- sylwetka `agile` (panda-b)
- łącznie dojście do ~200–250 plików WebP

### Świadomie później

- wzory kimona (`outfitPattern`)
- aury jako prawdziwe PNG zamiast emoji
- weapon-back (broń za tułowiem) tylko jeśli widać artefakty bez niej

---

## 5. Pipeline generacji (jak dostać spójność)

### Narzędzia

| Etap | Narzędzie | Rola |
| --- | --- | --- |
| Moodboard / szybki test stylu | Cursor GenerateImage / Gemini | nie produkcja warstw |
| Kanon pozycji (master) | ComfyUI + Flux/SDXL + **ControlNet OpenPose/Depth** + IP-Adapter/PuLID lub LoRA postaci | produkcja |
| Korekta dłoni / masek | ręcznie w Affinity/Photoshop albo inpaint | obowiązkowy QA |
| Cięcie / WebP / walidacja | `scripts/` w repo | automat |

Gemini i Cursor **nie zastąpią** ControlNet przy warstwach. Test z 2026-09-05 pokazał: styl trzymają, ale „pięść z dziurą pod kij” i identyczny szkielet między wariantami nie wychodzą pewnie z samego promptu.

### Kolejność generacji (krytyczna)

1. **Zatwierdź master body BEZ dłoni** — 4 pozy, rękawy kończą się na nadgarstku.
2. **Osobne arkusze dłoni per rodzina** — `empty`, `staff`, `dual`, `fan` (układy **różne**, nie kopia staff).
3. Dopiero potem bronie staff — ten sam pose control co body; dłonie `staff` na wierzchu.
4. Maski kimona/opaski.
5. Gadżety.
6. Logo.
7. Miniatury sklepowe.
8. Sylwetka `agile` dopiero po akceptacji `round`.

**Pilnować przy każdej generacji dłoni:**  
`staff` = obie pięści na jednej osi; `dual` = dwie osobne rękojeści w rozstawie; `fan` = chwyt asymetryczny z boku. Jeśli dwa arkusze wyglądają „tak samo” — odrzut.

### Zasady każdego PNG

- płótno 512 × 512 (produkcja może być 1024, skrypt downscaluje)
- tło przezroczyste **albo** `#F2F2F2` do flood-fill (jak dziś)
- wspólna linia stóp między pozami
- zero tekstu, ramek, znaków wodnych
- zero gwiazdek / Zzz / kanji (aplikacja dokłada efekty)
- zero cienia podłogi pod przedmiotami gadżetów/broni (zostaje brudna smuga)
- broń bez dłoni; dłonie osobno; albo broń + hands-front jako para

### Referencje stylu (już mamy)

- sheet użytkownika: arkusz Gemini (śpi / skupiona / świętuje / mruga / ikona)
- testy Cursor: `Desktop/panda-testy/`
- obecne `public/art/panda-a|b/` jako fallback i mood

---

## 6. Plan kodu (równolegle do grafiki)

### Faza 0 — uczciwy sklepik (1–2 dni kodu, zanim padną warstwy)

- wyłączyć doklejanie drugiej broni na flat sprite **albo** wyciąć broń z flat i zostawić samą pandę
- w katalogu: `gripFamily`, unikalne `preview` (koniec z trzema broniami = ten sam PNG)
- ukryć / oznaczyć „wkrótce” przedmioty bez assetu zamiast emoji-kłamstwa
- kolor kimona: zostać przy ColorChip tylko tymczasowo

### Faza 1 — runtime v2 (MVP)

- `PandaComposer` (lub rozbudowa `PandaStage`) czyta manifest v2
- stos warstw wg sekcji 1
- kolory przez `mask-image` na `kimono/mask` + `headband/mask`
- `npm run art:validate` — brak pliku = fail buildu albo feature flag OFF
- feature flag `usePandaV2` — włącz po przejściu walidacji `round+staff`

### Faza 2 — reszta sklepiku

- dual/fan, agile, pozostałe gadżety
- preloading tylko wyposażonych warstw + widoczna strona sklepu
- WebP + opcjonalnie atlas per poza

### Faza 3 — polish

- dostrojenie kotwic / bbox
- wzory kimona
- aury PNG
- CI: walidator na PR

---

## 7. Harmonogram pracy (ludzie × AI)

| Krok | Kto | Wynik |
| --- | --- | --- |
| A. Faza 0 w kodzie | agent | **DONE** — brak drugiej broni, comingSoon, unikalne preview |
| B. Master 4 pozy body | generacja + QA człowieka | **DONE** (zaakceptowany) |
| C. Hands staff + empty | generacja | **DONE** (+ dual/fan draft) |
| D. 5 broni staff × 4 | generacja | **DONE** |
| E. Maski kolorów | generacja / postprocess | **DONE** (draft) |
| F. 3 gadżety × 4 | generacja | **DONE** (draft) |
| G. Logos + shop thumbs | generacja | **DONE** logo; thumbs = pose training |
| H. PandaComposer + validate | agent | **DONE** — `USE_PANDA_V2=true` |
| I. Test na iPadzie | człowiek | **TERAZ** |
| J. Faza 2 dual/fan + agile | agent | **DONE** (agile = transform z round; dual/fan draft) |

Bez kroku B zatwierdzonego nie generować masowo broni — inaczej cały budżet idzie w śmietnik.

---

## 8. Kryteria jakości (odrzut)

Odrzuć asset jeśli:

- głowa / uszy / plamy oczu driftują względem mastera
- stopy nie siedzą na wspólnej linii
- broń przecina dłoń albo unosi się obok
- maska kimona obejmuje futro / tło
- widać resztki `#F2F2F2` albo cień podłogi po wycięciu
- w pliku są gwiazdki, Zzz, tekst, druga panda

---

## 9. Ryzyka i mitigacje

| Ryzyko | Mitigacja |
| --- | --- |
| AI nie trzyma dłoni | ControlNet + ręce jako warstwa top; ewentualnie ręczny redraw dłoni |
| iPad pamięć | WebP, lazy load, max 1 body pack w RAM |
| rodzic nie chce ComfyUI | Faza 1 zlecić ilustratorowi z checklistą warstw; agent i tak robi kod |
| scope creep | Faza 1 = tylko staff + 3 gadżety; reszta dopiero po akceptacji na iPadzie |

---

## 10. Status (2026-09-06)

1. ~~Faza 0 w kodzie.~~ **DONE**
2. ~~`art-validate` + folder `panda-v2`.~~ **DONE**
3. ~~Master body bez dłoni (round).~~ **DONE** — zaakceptowany
4. ~~Hands staff/empty/dual/fan + 5 broni staff.~~ **DONE**
5. ~~Maski kimono/opaska + 3 gadżety + 8 logo.~~ **DONE** (draft Cursor; QA na iPadzie)
6. ~~`USE_PANDA_V2 = true`~~ po `npm run art:validate` → **68/68 mvpReady**

Pipeline: `npm run art:v2` (= slice + `art-postprocess-v2` + validate).

**Znane niedociągnięcia draftu:** bronie czasem z resztkami dłoni; bokken sleeping mały; maska opaski heurystyczna z body; gadżety po odejmowaniu body; ComfyUI nadal docelowo do produkcji.

**Następne:** test na iPadzie (WebP + logo na płytce + miniatury) → ComfyUI masters jeśli jakość nie wystarczy.

**Faza 3 (polish):**
- logo kotwiczone na płytce opaski (`PANDA_V2_LOGO`)
- miniatury sklepu 128px (`npm run art:thumbs`)
- WebP + fallback PNG w composerze (`npm run art:webp`); PWA cache’uje `.webp`
- pipeline: `art → postprocess → thumbs → agile → webp → validate`
