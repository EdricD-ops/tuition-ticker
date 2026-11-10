# 参与贡献 · Contributing

[中文](#中文) · [English](#english)

## 中文

谢谢你愿意帮忙！最欢迎的贡献是**数据**：补学校、补公众假期、写吐槽文案。改代码也欢迎，较大的改动请先开 Issue 聊一下。

### 本地运行

需要 Node.js 22 或以上。

```bash
npm install
npm run dev      # 开发服务器，默认 http://localhost:5173
npm test         # 单元测试（会在三个时区下各跑一遍）
npm run build    # 类型检查 + 生产构建
```

### 补充学校：`presets/schools.json`

候选学校是 QS 世界大学排名 2027 前 500 名中的非内地高校。只存校名、地区和时区，**不存排名、分数、项目或学费**（学费因人而异，由用户自己填）。

```jsonc
{
  "id": "the-university-of-hong-kong",   // 英文名的 slug，必须唯一
  "name": "The University of Hong Kong", // 官方英文名
  "local": "香港大學",                    // 可选：学校所在地的官方本地名（港澳台用繁体）
  "zh": "香港大学",                       // 简体中文名，用于检索
  "aliases": ["HKU", "港大"],             // 可选：常用缩写 / 简称
  "country": "HK",                        // 地区代码，见 src/app/regions.ts
  "timeZone": "Asia/Hong_Kong"            // 主校区的 IANA 时区
}
```

- 修正译名、补缩写：直接改对应条目
- 不在列表里的学校也可以加，保持同样格式即可
- 改完运行 `npm test`，会检查地区、时区和 id 是否唯一

### 补充公众假期：`presets/holidays/{region}.json`

每个地区一个文件，文件名是小写地区代码（如 `hk.json`）。新文件放进去就会自动生效。

```jsonc
{
  "region": "HK",
  "source": "https://www.1823.gov.hk/common/ical/en.json", // 官方来源，必填
  "updated": "2026-11-10",                                  // 你核对数据的日期
  "holidays": [
    { "date": "2026-01-01", "name": { "en": "The first day of January", "zh": "一月一日" } },
    // 只适用于公务员的补假日加上 "kind": "compensatory"
  ]
}
```

- **只收官方来源**（政府公报、劳工部门网站等），PR 里贴上链接
- 按年份维护，日期用学校所在地的日历日期
- `zh` 用简体中文

### 吐槽文案：`src/data/quips.json`

`zh` 和 `en` 两个列表，看板底部轮播。语气：**自嘲、轻松，不要贩卖焦虑**，不针对任何学校或群体。

### 提交 PR

- 一个 PR 只做一件事
- 代码、注释、commit message 用英文
- 提交前跑一遍 `npm test` 和 `npm run build`
- 不要提交真实的个人课表、学号或学费

## English

Thanks for helping! The most welcome contributions are **data**: schools, public holidays and quips. Code changes are welcome too; please open an issue first for larger ones.

### Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # unit tests, run once in each of three time zones
npm run build    # type-check and production build
```

### Schools — `presets/schools.json`

Candidates are the QS World University Rankings 2027 top 500 outside mainland China. Entries hold names, region and time zone only — **no ranks, scores, programmes or tuition** (users enter their own). See the format above or `presets/README.md`. Fix names or add abbreviations in place; schools outside the list may be added in the same shape. Run `npm test` afterwards.

### Public holidays — `presets/holidays/{region}.json`

One file per region, named by the lower-case region code (e.g. `hk.json`); new files are picked up automatically. **Official sources only** — put the link in `source` and in your PR. Use `"kind": "compensatory"` for days off that only apply to civil servants. Keep `zh` names in Simplified Chinese.

### Quips — `src/data/quips.json`

Two lists, `zh` and `en`, rotated under the dashboard. Tone: self-deprecating and light-hearted; no fear-mongering, and nothing aimed at a particular school or group.

### Pull requests

- One change per PR
- Code, comments and commit messages in English
- Run `npm test` and `npm run build` before opening it
- Don't commit real personal timetables, student IDs or tuition
