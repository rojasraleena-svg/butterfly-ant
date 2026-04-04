#!/usr/bin/env python3
"""
butterfly-ant 文献批量检索工具
使用 PubMed + OpenAlex 双引擎检索
输出：结构化JSON + Markdown报告
"""

import json
import urllib.request
import urllib.parse
import time
import sys
from datetime import datetime

OUTPUT_DIR = "/workspace/projects/workspace/sites/butterfly-ant"

# ============ 检索主题定义 ============
SEARCH_TOPICS = {
    "lycaenidae_ant_general": {
        "query_pubmed": "Lycaenidae AND (ant OR myrmica) AND (mutualism OR symbiosis OR myrmecophily)",
        "query_openalex": "lycaenidae ant mutualism symbiosis",
        "desc": "灰蝶科-蚂蚁互作总览（最新）"
    },
    "maculinea_lifecycle": {
        "query_pubmed": "(Maculinea OR Phengaris) AND lifecycle AND ant nest",
        "query_openalex": "Maculinea Phengaris lifecycle ant nest parasitism",
        "desc": "大蓝蝶生命周期与巢内寄生"
    },
    "chc_chemical_mimicry": {
        "query_pubmed": "(cuticular hydrocarbon OR CHC) AND mimicry AND (ant OR Lycaenidae OR butterfly)",
        "query_openalex": "cuticular hydrocarbon CHC chemical mimicry butterfly ant lycaenidae",
        "desc": "CHC化学拟态"
    },
    "acoustic_vibration_signal": {
        "query_pubmed": "(vibration OR stridulation OR acoustic) AND (caterpillar OR larva) AND (ant OR Lycaenidae)",
        "query_openalex": "vibration stridulation acoustic signal caterpillar ant lycaenidae communication",
        "desc": "振动/声学信号通信"
    },
    "dno_nectary_organ": {
        "query_pubmed": "(dorsal nectary organ OR DNO) AND (Lycaenidae OR butterfly)",
        "query_openalex": "dorsal nectary organ DNO lycaenidae secretion honeydew",
        "desc": "背蜜腺(DNO)与分泌物"
    },
    "ant_attendance_survival": {
        "query_pubmed": "ant attendance AND (survival OR predation) AND (caterpillar OR Lepidoptera)",
        "query_openalex": "ant attendance survival predation caterpillar lepidoptera protection",
        "desc": "蚂蚁保护对幼虫存活率的影响"
    },
    "evolution_phylogeny": {
        "query_pubmed": "Lycaenidae AND (evolution OR phylogeny OR coevolution) AND ant",
        "query_openalex": "lycaenidae evolution phylogeny coevolution ant association",
        "desc": "进化与协同演化"
    }
}


def pubmed_search(query, retmax=15):
    """PubMed E-utilities 搜索 (使用 esummary 获取JSON详情)"""
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    
    # Step 1: Search
    params = urllib.parse.urlencode({"term": query, "db": "pubmed", "retmax": str(retmax), "sort": "relevance", "retmode": "json"})
    url = f"{base}/esearch.fcgi?{params}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    
    id_list = data.get("esearchresult", {}).get("idlist", [])
    if not id_list:
        return []
    
    # Step 2: Fetch details via esummary (returns clean JSON)
    ids = ",".join(id_list)
    fetch_url = f"{base}/esummary.fcgi?db=pubmed&id={ids}&retmode=json"
    req2 = urllib.request.Request(fetch_url)
    try:
        with urllib.request.urlopen(req2, timeout=20) as resp:
            details = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [WARN] PubMed esummary failed: {e}")
        return []
    
    results = []
    for pmid, article in details.get("result", {}).items():
        if pmid == "uids":
            continue
        
        title = article.get("title", "")
        
        # Extract year from pubdate
        pubdate = article.get("pubdate", "")
        year = pubdate.split("-")[0] if pubdate else ""
        
        # Authors
        authors = [a.get("name", "") for a in article.get("authors", []) if a.get("name")]
        
        # Journal
        journal = article.get("fulljournalname", "")
        
        # DOI
        doi = ""
        for aid in article.get("articleids", []):
            if aid.get("idtype") == "doi":
                doi = aid["value"]
                break
        
        results.append({
            "pmid": pmid,
            "title": title,
            "year": year,
            "authors": authors[:6],
            "journal": journal,
            "doi": doi,
            "abstract": "",  # esummary doesn't return abstract, use OpenAlex for that
            "source": "pubmed"
        })
    
    return results


def openalex_search(query, per_page=10):
    """OpenAlex Works API 搜索"""
    encoded_q = urllib.parse.quote(query)
    url = f"https://api.openalex.org/works?search={encoded_q}&per_page={per_page}&sort=publication_date:desc&filter=type:article"
    
    req = urllib.request.Request(url, headers={"User-Agent": "mailto:butterfly-ant-research@gqy25.top"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [WARN] OpenAlex failed: {e}")
        return []
    
    results = []
    for r in data.get("results", []):
        authors = []
        for a in r.get("authorships", []):
            author = a.get("author", {})
            if author.get("display_name"):
                authors.append(author["display_name"])
        
        venue = ""
        loc = r.get("primary_location") or {}
        src = loc.get("source") or {}
        if src.get("display_name"):
            venue = src["display_name"]
        
        doi = r.get("doi") or ""
        
        # Get OpenAlex ID
        oa_id = r.get("id", "").replace("https://openalex.org/", "")
        
        # Year
        year = r.get("publication_year", "")
        
        # Abstract (inverted index → text)
        abstract_inverted = r.get("abstract_inverted_index", {})
        if abstract_inverted:
            # Reconstruct abstract from inverted index
            all_words = []
            for word, positions in sorted(abstract_inverted.items(), key=lambda x: x[1][0]):
                all_words.extend([word] * len(positions))
            abstract = " ".join(all_words)[:500]
            if len(abstract) >= 500:
                abstract += "..."
        else:
            abstract = ""
        
        results.append({
            "oa_id": oa_id,
            "title": r.get("title", ""),
            "year": str(year),
            "authors": authors[:6],
            "journal": venue,
            "doi": doi,
            "abstract": abstract,
            "source": "openalex",
            "cited_by_count": r.get("cited_by_count", 0),
            "type": r.get("type", "")
        })
    
    return results


def main():
    all_results = {}
    report_lines = []
    
    report_lines.append(f"# 📚 butterfly-ant 最新文献检索报告")
    report_lines.append(f"\n> 检索时间: {datetime.now().strftime('%Y-%m-%d %H:%M')} | 引擎: PubMed + OpenAlex\n")
    
    total_found = 0
    
    for topic_key, topic_info in SEARCH_TOPICS.items():
        print(f"\n🔍 [{topic_key}] {topic_info['desc']}")
        print(f"   PubMed: {topic_info['query_pubmed'][:60]}...")
        
        report_lines.append(f"## 🔍 {topic_info['desc']}\n")
        
        # PubMed search
        pubmed_results = pubmed_search(topic_info["query_pubmed"], retmax=12)
        print(f"   → PubMed: {len(pubmed_results)} 篇")
        
        # OpenAlex search  
        alex_results = openalex_search(topic_info["query_openalex"], per_page=8)
        print(f"   → OpenAlex: {len(alex_results)} 篇")
        
        # Merge and deduplicate by DOI/title similarity
        merged = []
        seen_dois = set()
        seen_titles = set()
        
        for p in pubmed_results:
            key_doi = (p.get("doi") or "").lower()
            key_title = (p.get("title") or "").lower()[:80]
            if key_doi not in seen_dois and key_title not in seen_titles:
                if key_doi: seen_dois.add(key_doi)
                seen_titles.add(key_title)
                merged.append(p)
        
        for a in alex_results:
            key_doi = (a.get("doi") or "").lower()
            key_title = (a.get("title") or "").lower()[:80]
            if key_doi not in seen_dois and key_title not in seen_titles:
                if key_doi: seen_dois.add(key_doi)
                seen_titles.add(key_title)
                merged.append(a)
        
        # Sort by year descending
        merged.sort(key=lambda x: x.get("year") or "0000", reverse=True)
        
        all_results[topic_key] = merged
        total_found += len(merged)
        
        # Report
        if merged:
            report_lines.append(f"| # | 年份 | 标题 | 作者 | 来源 | DOI/PMID |")
            report_lines.append(f"|---|------|------|------|------|----------|")
            
            for i, paper in enumerate(merged[:12], 1):
                title = paper.get("title", "")[:90]
                authors_str = ", ".join(paper.get("authors", [])[:3])
                if len(paper.get("authors", [])) > 3:
                    authors_str += " et al."
                journal = paper.get("journal", "")[:35]
                
                # ID field
                if paper.get("pmid"):
                    pid = f"PMID:[{paper['pmid']}](https://pubmed.ncbi.nlm.nih.gov/{paper['pmid']})"
                elif paper.get("oa_id"):
                    pid = f"OA:[{paper['oa_id']}](https://openalex.org/works/{paper['oa_id']})"
                else:
                    pid = "-"
                
                doi_link = ""
                if paper.get("doi"):
                    doi_link = f"[DOI](https://doi.org/{paper['doi']})"
                
                source_icon = "📊" if paper.get("source") == "openalex" else "🔬"
                
                report_lines.append(
                    f"| {i} | **{paper.get('year', '-')}** | {title} | {authors_str} | {journal} | {pid} {doi_link} |"
                )
            
            report_lines.append(f"\n*共检索到 {len(merged)} 篇*\n")
        else:
            report_lines.append(f"*未检索到相关文献*\n")
        
        time.sleep(0.5)  # Rate limit courtesy
    
    # Save JSON
    json_path = f"{OUTPUT_DIR}/literature_search_results.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 JSON已保存: {json_path}")
    
    # Save Markdown report
    md_path = f"{OUTPUT_DIR}/LITERATURE_SEARCH_REPORT.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"📄 报告已保存: {md_path}")
    
    print(f"\n✅ 总计检索到 {total_found} 篇不重复文献")


if __name__ == "__main__":
    main()
