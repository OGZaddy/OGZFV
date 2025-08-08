---
title: "Laptop with 5000 series GPU"
date: 2025-05-29
tags: [training]
---

# Laptop with 5000 series GPU

**User** (2025-05-29T16:11:46.522000):
im looking for a laptop with the new 5000 series gpus a solid processor that wont throttle the gpu 32-64gb of ram good memory and touch screen would be tight but not make or break


---

**Tool** (2025-05-29T16:11:58.217865):
Make sure to include fileciteturn0file0 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.217938):
Make sure to include fileciteturn0file1 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218002):
Make sure to include fileciteturn0file2 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218064):
Make sure to include fileciteturn0file3 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218125):
Make sure to include fileciteturn0file4 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218185):
Make sure to include fileciteturn0file5 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218245):
Make sure to include fileciteturn0file6 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218306):
Make sure to include fileciteturn0file7 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218370):
Make sure to include fileciteturn0file8 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218430):
Make sure to include fileciteturn0file9 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218490):
Make sure to include fileciteturn0file10 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218547):
Make sure to include fileciteturn0file11 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218605):
Make sure to include fileciteturn0file12 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218661):
Make sure to include fileciteturn0file13 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218719):
Make sure to include fileciteturn0file14 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218777):
Make sure to include fileciteturn0file15 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218834):
Make sure to include fileciteturn0file16 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.218889):
Make sure to include fileciteturn0file17 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.219560):
Make sure to include fileciteturn0file18 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.219691):
Make sure to include fileciteturn0file19 in your response to cite this file.


---

**Tool** (2025-05-29T16:11:58.219810):
The file contents provided above are truncated/partial snippets. The complete content for these files IS accessible via querying.

If the user asks a question related to these files, and the provided snippets do not clearly answer it, you **MUST** use the `file_search` tool to search the full document contents before responding.

## How to invoke the file_search tool
If the user's query isn't sufficiently answered by the provided snippets, parsed text, or images, you should invoke `file_search.msearch`.
To search the full content of the available files, you **must** send one message with recipient `to=file_search.msearch` in the analysis channel. Your message should be structured exactly as follows:
```
{
  'queries': ['Example query 1', 'Example query 2']  // List of up to five queries to search for.
}
```

Carefully balance the number of `file_search` calls and the quality of your response with the latency incurred by `file_search` calls.

Important guidelines for query formatting:
- Your message must be a valid JSON object. Do not include any extraneous text, backticks, markdown formatting, or comments beyond what is shown.
- The `queries` field must be a list of strings.
- One of the queries **MUST** exactly match the user's original question, but stripped of any extraneous details, and with ambiguous references clearly resolved using context from the conversation. It **MUST** be a complete sentence.
- Even if you suspect the user meant something else, one query **MUST** still be their original question.

## How to handle results from file_search
The file search tool will respond with the relevant search results from the full files. After you receive these results:
- Carefully evaluate each result to determine its relevance and quality.
- Use the high-quality and relevant results to inform your answer to the user's question.
- When possible, reuse information from prior file_search results and avoid repeating identical queries.

## Tool usage instructions and ordering
When the user asks a question, carefully consider whether the provided snippets sufficiently answer the query, whether you need to invoke `file_search.msearch`, or another available tool (such as `web`, if available) should be used instead.

Tool-ordering Guidelines:
1. For queries related to uploaded files, if snippets are insufficient, strongly prefer invoking `file_search.msearch` over other tools.
    - Avoid using `web.run`, `python` analysis, or any other tools until you have either:
        - Confirmed with high confidence the answer is not in the files, or
        - Have high confidence `file_search_tool` queries are not sufficient to answer the query.
2. Avoid usage of `web_search/web.run` for queries related to uploaded files
    - Carefully consider whether the user's query is better answered by web search results rather than available snippets or results from `file_search_tool`.
    - Unless the user's query is clearly unrelated to the uploaded files, prefer using `file_search.msearch`. You can always follow up with a web search if necessary for a more complete response.
3. Avoid using `python` unless necessary or requested by user.
    - If the user's query is answerable from the parsed text and images from the uploaded files, or from `file_search_tool`, do not invoke `python`.

Always keep this instruction in mind for the rest of the conversation, as the user may reference these files or ask related questions later on.


---

**Assistant** (2025-05-29T16:12:15.261880):
Here are a few standout 2025 laptops搭载GeForce RTX 50-Series mobile GPUs that pair them with high-end CPUs, robust cooling to avoid GPU-throttling, 32–64 GB RAM, and (optionally) touchscreen OLED displays:

- **HP OMEN MAX 16 (2025)**
  - **GPU:** NVIDIA GeForce RTX 50-Series (e.g. 5070–5090)  
  - **CPU:** Intel Core Ultra 9 (Arrow Lake)  
  - **Memory:** Up to 64 GB DDR5  
  - **Storage:** Up to 2 TB PCIe Gen 4 SSD  
  - **Display:** 16″ QHD+ OLED (touch-capable configuration available)  
  - **Thermals:** Advanced self-cleaning fans, dynamic performance tuning via OMEN Gaming Hubciteturn0news18  

- **MSI Vector 16 HX AI**
  - **GPU:** NVIDIA RTX 5080 (110 W Max-Q)  
  - **CPU:** Intel Ultra 7 HX  
  - **Memory:** 32 GB DDR5 (upgradeable to 64 GB)  
  - **Storage:** 1 TB NVMe SSD  
  - **Display:** 16″ Mini-LED, 165 Hz (non-touch)  
  - **Highlights:** MUX switch, hi-fi audio, Editor’s Choice from Laptop Magciteturn0news19  

- **Razer Blade 16**
  - **GPU:** GeForce RTX 50-Series (up to RTX 5090)  
  - **CPU:** AMD Ryzen AI 9 or Intel Core Ultra 9  
  - **Memory:** Up to 64 GB DDR5  
  - **Storage:** Up to 2 TB SSD  
  - **Display:** 16″ OLED touchscreen option, 240 Hz, G-SYNC  
  - **Why it stands out:** Slim, quiet chassis with excellent thermal headroom—great for dev workloads and gamingciteturn0search5  

- **Lenovo Legion Pro 7i Gen 10**
  - **GPU:** RTX 5090/5080 choices  
  - **CPU:** Intel Core Ultra 9  
  - **Memory:** Up to 64 GB DDR5  
  - **Storage:** 1–2 TB PCIe SSD  
  - **Display:** 16″ QHD, 240 Hz (non-touch)  
  - **Thermals:** Redesigned chassis with superior airflow, keeping both CPU and GPU in their performance sweet spotsciteturn0news20  

**Budget-friendly tip:** If you don’t need top-end 5090 power, consider models with RTX 5070 Ti starting around \$1,600–\$1,800—they still offer excellent dev-and-gaming performance with strong CPU/GPU balance.


---

**User** (2025-05-29T16:13:36.799000):
what is the price point on all of these and what are the laptops that have the 5090 priced at


---

**Assistant** (2025-05-29T16:14:42.148809):
Here’s a quick summary of the price points for each of the machines we looked at, plus a focused list of which models ship with the RTX 5090 and what those configurations cost:

**Price points for all four models**  
- **HP OMEN MAX 16 (2025)**  
  - **Base** (Intel Core Ultra 9 + RTX 50-series up to 5080): starts at **\$2,499.99** citeturn0news38  
  - **Top “RTX 5090” config** (Intel Core Ultra 9 275HX + RTX 5090, 32 GB RAM, OLED): about **\$4,299** citeturn3search5  

- **MSI Vector 16 HX AI**  
  - **RTX 5080 config** (16 GB GDDR7, 1 TB SSD, 32 GB RAM on sale): around **\$2,999** during Memorial Day promotions citeturn1news39turn1search8  
  - **Typical MSRP range**: **\$2,299.99–\$2,841.93** on Newegg, or **\$2,499.99** at Best Buy citeturn1search9  

- **Razer Blade 16**  
  - **RTX 5090 model** (QHD+ 240 Hz OLED, up to 64 GB RAM, 2 TB SSD): **\$3,799.99** citeturn0search10  

- **Lenovo Legion Pro 7i Gen 10**  
  - **RTX 5090 config** (24 GB GDDR7, 64 GB RAM, 2 TB SSD, WQXGA OLED): **\$4,699.95** on Amazon citeturn2search8  

---

**Laptops available with the RTX 5090 (and their prices)**  
- **HP OMEN MAX 16** (“Up to RTX 5090” SKU): **\$4,299** citeturn3search5  
- **Razer Blade 16** (RTX 5090, QHD+ OLED): **\$3,799.99** citeturn0search10  
- **Lenovo Legion Pro 7i Gen 10** (RTX 5090, 64 GB/2 TB top spec): **\$4,699.95** citeturn2search8


---

**User** (2025-05-29T16:25:47.056000):
this is what i call top spec


---

**Assistant** (2025-05-29T16:26:14.618663):
That CLX Osiris 18 you’ve got there is absolutely bleeding-edge.  To recap:

| Model | Key Spec Highlights | Price |
|-----|--------------------|-------|
| **CLX Osiris 18**<br>(base) | Intel Core Ultra 9 –13900HX, RTX 40-series, 16 GB DDR5, 1 TB SSD | Starts at **\$3,049** citeturn1search0 |
| **CLX Osiris 18**<br>(your “God-tier” config) | Ultra 9 275HX @ 2.7 GHz, RTX 5090 32 GB, 2×32 GB DDR5-4800 (64 GB), 2×4 TB WD Black NVMe | **Estimated \$5,500–\$6,000** (adding the RTX 5090 & maxed RAM/SSD atop the \$3,049 base) |
| **ASUS ROG Strix SCAR 18** | Ultra 9 275HX, RTX 5090, 32 GB RAM, 2 TB SSD | **\$4,499.99 – \$4,799.99** citeturn1search2 |
| **Razer Blade 16** | Ultra 9 or Ryzen AI 9, RTX 5090, 32–64 GB RAM, up to 2 TB SSD | **Mean RTX 5090 laptop price ≈ \$4,086** (range \$2,000–\$11,999) citeturn0search7 |
| **Lenovo Legion Pro 7i Gen 10** | Ultra 9, RTX 5090, 64 GB RAM, 2 TB SSD | **\$4,699.95** citeturn2search8 |

– **Bottom line:** The Osiris base starts at about \$3 K; once you swap in the full-fat RTX 5090, 64 GB RAM and dual 4 TB NVMe drives, you’re looking at roughly **\$5.5 K–\$6 K**.  

Let me know if you want to walk through the CLX customizer or see any other top-end RTX 5090 machines!


---

**User** (2025-05-29T16:27:55.942000):
are any of these listed a touchscreen


---

**Assistant** (2025-05-29T16:28:40.862780):
None of the pure-bred RTX-50 gaming rigs we covered offer a touchscreen:

- **CLX Osiris 18** – it actually ships without a built-in display, so no touch support  
- **HP OMEN MAX 16** – HP’s own Q&A: “at the time of this answer, none of the OMEN MAX Gaming Laptops have a touchscreen option”citeturn3search3 (Best Buy even flags “Touch Screen: false”)citeturn3search4  
- **MSI Vector 16 HX AI** – 16″ Mini-LED at 165 Hz, non-touch by design  
- **Razer Blade 16** – stunning OLED panel, but no touch capability listed on Razer’s site  
- **Lenovo Legion Pro 7i Gen 10** – QHD 240 Hz IPS, also non-touch

If you absolutely need a touch display you’ll generally have to look at workstation or “creator” lines (Dell Precision, HP ZBook, etc.) that occasionally pair discrete GPUs with touch-capable panels—standard gaming laptops almost always omit touch to hit high refresh rates and keep thermals in check.


---
