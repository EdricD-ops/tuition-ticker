# Presets

Community-maintained data bundled into the app.

## Candidate schools — `presets/schools.json`

The "School" box suggests these as the user types (English, local-script name, simplified
Chinese or an abbreviation). Picking one fills the school name plus its region, currency and
time zone. **Programme and tuition are always entered by the user**, since they differ from
person to person.

The list is the QS World University Rankings 2027 top 500 outside mainland China. Only names,
country and time zone are stored — no ranks or scores.

```jsonc
{
  "id": "the-university-of-hong-kong",     // unique slug of the English name
  "name": "The University of Hong Kong",   // official English name
  "local": "香港大學",                      // optional: official name in the school's own script
                                            //   (Traditional Chinese for HK / Macau / Taiwan,
                                            //   Simplified for Singapore, Japanese, Korean)
  "zh": "香港大学",                         // Simplified Chinese name, for search and hints
  "aliases": ["HKU", "港大"],               // optional: abbreviations people search by
  "country": "HK",                          // region code from src/app/regions.ts
  "timeZone": "Asia/Hong_Kong"              // IANA zone of the main campus
}
```

The dashboard shows `local` + `name` when a local name exists ("香港大學 The University of Hong
Kong"), otherwise `name`. `npm test` checks every entry (region, time zone, unique id) and a set
of searches. To add a school outside the list, add an entry in the same shape.

## Public holidays — `presets/holidays/{region}.json`

One file per region with the official source and update date; see `hk.json` and `mo.json`.
