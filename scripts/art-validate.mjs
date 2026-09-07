#!/usr/bin/env node
/**
 * Waliduje paczkę panda-v2 (MVP round + opcjonalnie agile).
 * Użycie: npm run art:validate
 * Zapisuje public/art/panda-v2/status.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v2Root = path.join(root, 'public', 'art', 'panda-v2');
const manifestPath = path.join(v2Root, 'manifest.json');
const statusPath = path.join(v2Root, 'status.json');

const EXTS = ['.webp', '.png'];

function existsAsset(relNoExt) {
  for (const ext of EXTS) {
    const full = path.join(v2Root, relNoExt + ext);
    if (fs.existsSync(full) && fs.statSync(full).size > 200) return true;
  }
  return false;
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Brak manifestu: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

/** Te same warstwy co MVP, dla wskazanego body. */
function requiredForBody(manifest, body) {
  const poses = manifest.poses;
  /** @type {string[]} */
  const required = [];

  for (const pose of poses) {
    required.push(`${body}/body/${pose}`);
    for (const grip of manifest.mvp.gripFamilies) {
      required.push(`${body}/hands/${grip}/${pose}`);
      // pięści rozbite na ręce przez npm run art:anchor
      required.push(`${body}/hands/${grip}/${pose}-l`);
      required.push(`${body}/hands/${grip}/${pose}-r`);
      required.push(`${body}/hands/${grip}/${pose}-solo`);
    }
    if (manifest.mvp.requireKimonoMasks) {
      required.push(`${body}/kimono/mask/${pose}`);
      required.push(`${body}/kimono/shade/${pose}`);
    }
    if (manifest.mvp.requireHeadbandMasks) {
      required.push(`${body}/headband/mask/${pose}`);
      required.push(`${body}/headband/shade/${pose}`);
    }
    for (const weapon of manifest.mvp.weapons) {
      required.push(`${body}/weapons/${weapon}/${pose}`);
    }
    for (const gadget of manifest.mvp.gadgets) {
      required.push(`${body}/gadgets/${gadget}/${pose}`);
    }
  }

  for (const logo of manifest.mvp.logos) {
    required.push(`${body}/logos/${logo}`);
  }

  return required;
}

function main() {
  const manifest = readManifest();
  const mvpRequired = requiredForBody(manifest, manifest.mvp.body);
  const mvpMissing = mvpRequired.filter((rel) => !existsAsset(rel));
  const mvpPresent = mvpRequired.length - mvpMissing.length;
  const mvpReady = mvpMissing.length === 0;

  const agileBody = manifest.phase2?.body ?? 'agile';
  const wantAgile = (manifest.bodies ?? []).includes(agileBody);
  let agileRequired = [];
  let agileMissing = [];
  let agilePresent = 0;
  let agileReady = !wantAgile;

  if (wantAgile) {
    agileRequired = requiredForBody(manifest, agileBody);
    agileMissing = agileRequired.filter((rel) => !existsAsset(rel));
    agilePresent = agileRequired.length - agileMissing.length;
    agileReady = agileMissing.length === 0;
  }

  const status = {
    checkedAt: new Date().toISOString(),
    canvas: manifest.canvas,
    body: manifest.mvp.body,
    required: mvpRequired.length,
    present: mvpPresent,
    missing: mvpMissing,
    mvpReady,
    agile: wantAgile
      ? {
          body: agileBody,
          required: agileRequired.length,
          present: agilePresent,
          missing: agileMissing,
          ready: agileReady,
        }
      : null,
  };

  fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

  console.log(`panda-v2 MVP (${manifest.mvp.body}): ${mvpPresent}/${mvpRequired.length}`);
  if (wantAgile) {
    console.log(`panda-v2 agile: ${agilePresent}/${agileRequired.length}`);
  }

  if (mvpReady) console.log('mvpReady = true');
  else {
    console.log('mvpReady = false — brakuje:');
    for (const rel of mvpMissing.slice(0, 30)) console.log(`  - ${rel}`);
  }

  if (wantAgile) {
    if (agileReady) console.log('agileReady = true');
    else {
      console.log('agileReady = false — brakuje:');
      for (const rel of agileMissing.slice(0, 30)) console.log(`  - ${rel}`);
    }
  }

  process.exit(mvpReady ? 0 : 1);
}

main();
