# Handoff dla Cursora — co zostało zrobione i co zostało do zrobienia

Data: 2026-09-07. Gałąź: **`paper-doll-kotwice`** (master nietknięty).
Commit: `2cb94d4 Sklepik naprawdę przebiera pandę: kotwice zamiast lockFrame`.

---

## 1. Diagnoza — dlaczego to nie działało

Warstwy `panda-v2` nie były złe. **Złe było ich sadzanie.**

Generator rysował każdy przedmiot na pełną klatkę 512×512 (ładny close-up kija,
plecaka, pięści). `PandaComposer` stackował te pliki 1:1 (`lockFrame`), więc na
pandzie wielkości pandy lądowała pięść wielkości pandy.

Wcześniejszy wniosek — „bez ControlNet warstwy się nie złożą" — zakładał, że
warstwa musi mieć **ten sam kadr co body**. Nie musi. Przedmiot jest przycinany
do bbox alfy i sadzany kotwicą, więc kadr generatora i tak leci do kosza.

**ComfyUI zostało odłożone.** Nie było potrzebne do ani jednego nowego pliku.

---

## 2. Co jest w commicie `2cb94d4`

### Nowe źródło prawdy

**`src/data/panda-anchors.json`** — jeden plik czytany i przez aplikację
(`src/lib/pandaAnchors.ts`), i przez skrypty w `scripts/`. Zawiera:

- `anchors.<poza>` — gdzie są dłonie (`handMain`, `handOff`), środek chwytu
  (`grip` z kątem i rozstawem), płytka opaski, twarz, plecy, pas, aura.
  Wszystko w % płótna 512.
- `slots` — jak duży jest domyślnie każdy typ warstwy.
- `items.<assetKey>` — nadpisania per przedmiot: `wMul`, `dx`, `dy`, `rotate`,
  `normalizeAxis`.
- `masks` — ziarna flood filla do generowania masek koloru.
- `bodies` — współczynnik zwężenia sylwetki `agile` (0.88).

### Nowe skrypty

| Skrypt | Co robi |
| --- | --- |
| `scripts/art-anchor-v2.mjs` | przycina warstwy do bbox, prostuje oś broni kijowych do poziomu, rozbija arkusz dłoni na `<poza>-l/-r/-solo.png` |
| `scripts/art-masks-v2.mjs` | generuje maski i shade kimona/opaski **flood fillem z rysunku body** — bez AI |
| `scripts/art-contact-sheet.mjs` | kontaktówka QA 9 broni × 4 pozy do `art-qa/` |

Wszystkie skrypty przyjmują `PANDA_ROOT` (uruchamianie spoza repo).

### Zmienione

- **`src/lib/pandaAnchors.ts`** (nowy) — liczy `Placement { x, y, w, rotate }`
  z kotwic. Broń skaluje się **rozstawem rąk** (`grip.span`), nie stałą liczbą,
  więc kij w `celebrating` (ręce w górze) jest dłuższy niż w `sleeping` bez
  osobnych plików.
- **`src/lib/pandaV2.ts`** — `buildComposeLayers` używa kotwic; pięści to dwie
  osobne warstwy (`hands-off`, `hands`), a poza `hurry` ma jedną (`-solo`)
  zamiast drugiej wiszącej w powietrzu.
- **`src/components/PandaComposer.tsx`** — warstwa kotwiczona to
  `width: <kotwica>%; height: auto`, więc proporcje bierze przeglądarka z pliku
  (żaden manifest rozmiarów nie jest potrzebny w runtime). Shade koloru leci
  przez `mix-blend-mode: multiply`, a kontener ma `isolation: isolate`.
- **`scripts/art-agile-from-round.mjs`** — zwęża **tylko body**, resztę kopiuje
  1:1. Kotwica sama zna współczynnik `agile`.
- **`scripts/art-validate.mjs`** — wymaga też plików `-l/-r/-solo`. Wynik:
  **92/92** dla `round` i `agile`.
- **`src/lib/constants.ts`** — `USE_PANDA_V2 = true`, wyrzucone martwe
  `PANDA_V2_HAND / WEAPON / LOGO`.
- **`src/lib/pandaCompose.ts`** — wyrzucone stare `POSE_ANCHORS` (nieużywane).
- **`vite.config.ts`** — `globIgnores: ['**/art/panda-v2/**/*.png']`. PWA
  cache'owała ~34 MB PNG zdublowanych obok WebP; teraz idzie sam WebP.
- **`package.json`** — nowa kolejność `art:v2`:
  `art → art:postprocess → art:agile → art:masks → art:anchor → art:thumbs → art:webp → art:validate`

### Testy

`src/lib/pandaAnchors.test.ts` (nowy, 7 testów) + rozszerzone `pandaV2.test.ts`.
Razem **92 testy przechodzą**, `tsc --noEmit` czysty.

### Dokumentacja

- `docs/07-KOTWICE.md` — jak działa silnik i gdzie co stroić (**kanoniczne**)
- `docs/06-COMFYUI.md` — przepisane na „kiedy ComfyUI naprawdę wróci"
- `docs/05-WDROZENIE-ART.md` — poprawiony pipeline i status
- `README.md` — sekcja „Pandy v2 (paper-doll)"

---

## 3. Czego NIE cofać

To są świadome decyzje, nie przeoczenia:

1. **Nie wracać do `lockFrame` / stackowania warstw 1:1.** To był cały bug.
2. **Nie generować masek koloru AI-em.** Maski liczy flood fill z body
   (`art:masks`) — deterministycznie i powtarzalnie. Stare maski z generatora
   były progowaniem po całym kadrze: szum w tle, maska opaski na oczach.
3. **Nie skalować warstw `agile` w plikach.** Zwężane jest tylko body; kotwica
   zna `bodies.agile.sx`. Skalowanie obu naraz zwęża wszystko dwa razy.
4. **Nie dodawać manifestu rozmiarów warstw do runtime.** `height: auto`
   załatwia proporcje po stronie przeglądarki.
5. **Nie instalować ComfyUI** do samych warstw — powód w `docs/06-COMFYUI.md`.

---

## 4. Co jest NIEDOKOŃCZONE — edytor kotwic

W repo leżą **niezacommitowane** zmiany:

```
 M src/lib/pandaAnchors.ts      (gotowe — dodane setAnchorOverride + slots z JSON-a)
?? src/dev/AnchorTuner.tsx      (gotowe — cały komponent edytora)
```

`tsc --noEmit` na tym przechodzi. **Brakują dwa kawałki, żeby to odpalić:**

### 4a. Wejście dev w `src/main.tsx`

Pod adresem z `#kotwice` ma się renderować edytor zamiast aplikacji, i **tylko
w dev** (dynamiczny import, żeby nie wszedł do produkcyjnego bundla):

```tsx
const root = document.getElementById('root');
if (!root) throw new Error('Brak elementu #root');
const app = createRoot(root);

if (import.meta.env.DEV && window.location.hash.startsWith('#kotwice')) {
  void import('./dev/AnchorTuner').then(({ AnchorTuner }) =>
    app.render(<AnchorTuner />),
  );
} else {
  app.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
```

### 4b. Zapis do pliku — plugin dev-serwera w `vite.config.ts`

Edytor strzela `POST /__anchors` z całym JSON-em. Dev-serwer ma to zapisać do
`src/data/panda-anchors.json`. Plugin `apply: 'serve'`, więc nie dotyka
produkcji:

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/** Zapis kotwic z edytora #kotwice prosto do pliku (tylko dev). */
function anchorSaver(): Plugin {
  const file = path.resolve(__dirname, 'src/data/panda-anchors.json');
  return {
    name: 'panda-anchor-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__anchors', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            fs.writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}
```

…i dopisać `anchorSaver()` do tablicy `plugins`.

### Co edytor już umie (`src/dev/AnchorTuner.tsx`)

- podgląd składany **tym samym `PandaComposer`** co aplikacja (przez
  `setAnchorOverride`), więc co widać w edytorze, to będzie na iPadzie
- przeciąganie myszą 8 punktów kotwic na każdej pozie
- suwaki: kąt i rozstaw chwytu, szerokości płytki/twarzy/pleców/pasa/aury
- suwaki wspólne: długość kija względem rozstawu, rozmiar pięści, logo, wachlarz
- suwaki per przedmiot: `wMul`, `dx`, `dy`, `rotate`
- przełączniki pozy, broni, gadżetów, logo i kolorów
- „Zapisz do pliku", „Kopiuj JSON", „Reset"

Po dopisaniu 4a i 4b: `npm run dev`, wejść na `http://localhost:5173/#kotwice`.

### Do rozważenia przy okazji

- test na `AnchorTuner` nie jest potrzebny (dev-only), ale warto sprawdzić, czy
  produkcyjny `npm run build` **nie** wciąga `src/dev/` do bundla
- `setAnchorOverride` musi zostać wyzerowane przy odmontowaniu (jest w `useEffect`)

---

## 5. Znane braki jakościowe (nie bugi kodu)

- **Styl kilku gadżetów odstaje od dojo** — okulary wyszły steampunkowe,
  peleryna ma białą podszewkę, która w pozie `sleeping` wygląda jak chusta.
  To wymaga przerysowania grafiki, nie zmiany kotwic.
- **`agile` to wciąż zwężony `round`**, nie osobna sylwetka. Działa, ale to ta
  sama panda o 12% węższa.
- **Kotwice są dostrojone „na oko"** przeze mnie na kontaktówce. Część siedzi
  dobrze, część nie — po to jest edytor z punktu 4.
- **Wzory kimona** (`outfitPattern`) to kafelek przez multiply — do oceny na
  ekranie iPada.

---

## 6. Komendy

```bash
npm run art:v2        # pełny przelot arkusze → warstwy → WebP → walidacja
npm run art:anchor    # samo przycinanie i kotwiczenie (idempotentne)
npm run art:masks     # same maski koloru z body
npm run art:sheet     # kontaktówka QA → art-qa/contact-round.png
npm run art:sheet -- agile
npm run test          # 92 testy
npm run build         # tsc --noEmit + vite build
```

Po zmianie samych kotwic **nie trzeba** przepuszczać grafiki przez pipeline —
to jest tylko matematyka w runtime.

---

## 7. Deploy

Pages buduje się **tylko z `master`**. Gałąź `paper-doll-kotwice` nie jest
jeszcze wypchnięta (`git push -u origin paper-doll-kotwice`).

Do testu na iPadzie bez ruszania mastera: `npm run dev` i adres z terminala
w Safari na iPadzie.
