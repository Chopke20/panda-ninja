# ComfyUI — kiedy naprawdę jest potrzebne

Status: **odłożone**. Nic nie instaluj, dopóki nie trafisz na jeden z punktów
z sekcji 2.

---

## 1. Dlaczego nie teraz

Ten dokument zaczął się od wniosku: „bez ControlNet warstwy się nie złożą".
Wniosek był oparty na złym założeniu — że warstwa musi mieć **ten sam kadr** co
body, więc trzeba zablokować pozę w generatorze.

Nie musi. Przedmiot i tak jest przycinany do bbox i sadzany kotwicą
(`docs/07-KOTWICE.md`). Kadr, w którym powstał, jest wyrzucany.

Warstwy, które wygenerował Cursor/Gemini — kije, nunchaku, wachlarz, plecak,
gogle, medaliony — są **dobre jako osobne przedmioty**. Sklepik przebiera
pandę na wszystkich czterech pozach bez jednego nowego pliku PNG.

ControlNet rozwiązywał problem, którego nie było. Blokada siedziała w
composerze.

---

## 2. Kiedy wrócić do generatora

Dopiero gdy potrzebujesz czegoś, czego **nie da się złożyć z tego, co jest**:

| Potrzeba | Czy kotwice wystarczą? |
| --- | --- |
| kolejna broń kijowa | tak — jeden PNG przedmiotu na białym, reszta z kotwic |
| kolejny gadżet (czapka, szal) | tak |
| inny kolor / logo | tak, bez grafiki |
| **nowa poza body** (np. ukłon, bieg) | **nie** — potrzeba 1 body + maski |
| **prawdziwie inna sylwetka brata** | **nie** — `agile` to dziś zwężony `round` |
| **przerysowanie gadżetu w stylu dojo** | **nie** — okulary/peleryna odstają stylem |

Czyli: generator jest dziś potrzebny do **body i stylu**, nie do warstw.

---

## 3. Co zamówić, jak już będzie trzeba

Do nowej pozy wystarczy **jeden** obrazek, nie osiem warstw:

```
Ta sama panda ninja co w załączniku, cel-shade, czysty czarny kontur,
NOWA POZA: <opis>. Rękawy kończą się na nadgarstku (bez dłoni).
Tło jednolite #F2F2F2. Bez broni, bez gadżetów, bez gwiazdek, bez tekstu.
Stopy na tej samej linii co w referencji.
```

Negatyw:

```
text, watermark, second panda, extra arms, floor shadow, stars, zzz,
kanji, photo, 3d, realistic fur, blood, scary
```

Potem:

1. wrzuć do arkusza `art-sheets/panda-v2-round-body.png` w odpowiednią komórkę,
2. dopisz pozę w `src/data/panda-anchors.json` (`poses`, `anchors`, `masks`),
3. `npm run art:v2 && npm run art:sheet` i oglądaj kontaktówkę.

Dłonie, bronie i maski **nie wymagają** regeneracji — pięści są rozbite
z istniejącego arkusza, maski liczy flood fill z nowego body.

---

## 4. Jeśli jednak lokalny ComfyUI

Wymagania: Windows + NVIDIA ≥ 8 GB VRAM (12 wygodniej), 20–40 GB na modele.
Brak takiej karty → RunComfy / ThinkDiffusion w przeglądarce albo ilustrator.

Stack: SDXL (RealVisXL / Juggernaut XL) + ControlNet Depth (0.75–0.9) +
IP-Adapter ze stylem z `public/art/panda-v2/round/body/training.png` (waga
0.4–0.6). OpenPose tylko gdy Depth gnie ręce.

Ale przeczytaj sekcję 2, zanim zaczniesz ściągać modele. Do pojedynczego
przedmiotu na białym tle wystarczy zwykły generator obrazków, bo kotwice i tak
przytną kadr.

---

## 5. Alternatywa: ilustrator

Przy nowej pozie brief jest krótki: „ta panda, ta kreska, nowa poza, rękawy bez
dłoni, tło #F2F2F2". To jedno zlecenie, nie tydzień walki z nodami — i przy
2–3 pozach zwykle taniej niż zbudowanie sobie studia AI.
