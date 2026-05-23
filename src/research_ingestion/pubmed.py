from __future__ import annotations

import html
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import date

from .polite import polite_get
from .schema import normalize_record

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


def pubmed_search(term: str, retmax: int = 20, email: str | None = None) -> list[str]:
    params = {
        "db": "pubmed",
        "term": term,
        "retmode": "json",
        "retmax": str(retmax),
        "sort": "relevance",
    }
    if email:
        params["email"] = email
    url = f"{EUTILS}/esearch.fcgi?{urllib.parse.urlencode(params)}"
    data = polite_get(url, respect_robots=False)
    import json

    payload = json.loads(data.decode("utf-8"))
    return payload.get("esearchresult", {}).get("idlist", [])


def pubmed_fetch(pmids: list[str], email: str | None = None) -> list[dict]:
    if not pmids:
        return []
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
    }
    if email:
        params["email"] = email
    url = f"{EUTILS}/efetch.fcgi?{urllib.parse.urlencode(params)}"
    xml_bytes = polite_get(url, respect_robots=False)
    root = ET.fromstring(xml_bytes)
    return [parse_pubmed_article(article) for article in root.findall(".//PubmedArticle")]


def pmc_fetch(pmcid: str, email: str | None = None) -> dict:
    numeric_id = pmcid.upper().removeprefix("PMC")
    params = {
        "db": "pmc",
        "id": numeric_id,
        "retmode": "xml",
    }
    if email:
        params["email"] = email
    url = f"{EUTILS}/efetch.fcgi?{urllib.parse.urlencode(params)}"
    xml_bytes = polite_get(url, respect_robots=False)
    root = ET.fromstring(xml_bytes)
    article = root.find(".//article")
    if article is None:
        raise ValueError(f"No PMC article XML returned for {pmcid}")
    return parse_pmc_article(article, pmcid=pmcid.upper())


def parse_pubmed_article(article: ET.Element) -> dict:
    medline = article.find("MedlineCitation")
    citation = medline.find("Article") if medline is not None else article.find(".//Article")
    pmid = text_or_empty(article.find(".//PMID"))
    title = join_text(citation.find("ArticleTitle") if citation is not None else None)
    abstract = "\n".join(
        join_text(node)
        for node in article.findall(".//AbstractText")
        if join_text(node)
    )
    authors = []
    for author in article.findall(".//Author"):
        last = text_or_empty(author.find("LastName"))
        fore = text_or_empty(author.find("ForeName"))
        collective = text_or_empty(author.find("CollectiveName"))
        name = collective or " ".join(part for part in [fore, last] if part)
        if name:
            authors.append(name)
    journal = text_or_empty(article.find(".//Journal/Title"))
    pub_date = extract_pub_date(article)
    keywords = [join_text(node) for node in article.findall(".//Keyword") if join_text(node)]
    doi = ""
    pmcid = ""
    for article_id in article.findall(".//ArticleId"):
        id_type = article_id.attrib.get("IdType", "")
        if id_type == "doi":
            doi = text_or_empty(article_id)
        if id_type == "pmc":
            pmcid = text_or_empty(article_id)
    identifiers = {"pmid": pmid}
    if doi:
        identifiers["doi"] = doi
    if pmcid:
        identifiers["pmcid"] = pmcid
    source_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ""
    full_text_url = f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/" if pmcid else ""
    return normalize_record(
        {
            "title": title,
            "authors": authors,
            "publication": journal,
            "date": pub_date,
            "abstract": abstract,
            "keywords": keywords,
            "source_url": source_url,
            "retrieval_date": date.today().isoformat(),
            "source_name": "PubMed",
            "source_type": "api_metadata",
            "identifiers": identifiers,
            "open_access": bool(pmcid),
            "full_text_url": full_text_url,
            "text": abstract,
        }
    )


def parse_pmc_article(article: ET.Element, pmcid: str) -> dict:
    front = article.find("front")
    article_meta = front.find("article-meta") if front is not None else article.find(".//article-meta")
    title = join_text(article_meta.find(".//title-group/article-title") if article_meta is not None else None)
    abstract = "\n".join(
        join_text(node)
        for node in article.findall(".//abstract//p")
        if join_text(node)
    )
    authors = []
    for contrib in article.findall(".//contrib[@contrib-type='author']"):
        surname = text_or_empty(contrib.find(".//surname"))
        given = text_or_empty(contrib.find(".//given-names"))
        collab = text_or_empty(contrib.find(".//collab"))
        name = collab or " ".join(part for part in [given, surname] if part)
        if name:
            authors.append(name)
    journal = text_or_empty(article.find(".//journal-title"))
    pub_date = extract_pmc_pub_date(article)
    keywords = [join_text(node) for node in article.findall(".//kwd") if join_text(node)]
    identifiers = {"pmcid": pmcid}
    for article_id in article.findall(".//article-id"):
        id_type = article_id.attrib.get("pub-id-type", "")
        value = text_or_empty(article_id)
        if id_type and value:
            identifiers[id_type] = value
    body_sections = extract_pmc_sections(article)
    references = extract_pmc_references(article)
    text = "\n\n".join(section["text"] for section in body_sections if section["text"])
    return normalize_record(
        {
            "title": title,
            "authors": authors,
            "publication": journal,
            "date": pub_date,
            "abstract": abstract,
            "keywords": keywords,
            "source_url": f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/",
            "retrieval_date": date.today().isoformat(),
            "source_name": "PubMed Central",
            "source_type": "pmc_full_text_xml",
            "identifiers": identifiers,
            "open_access": True,
            "full_text_url": f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/",
            "text": text or abstract,
            "references": references,
        }
    )


def extract_pmc_sections(article: ET.Element) -> list[dict[str, str]]:
    sections = []
    body = article.find("body")
    if body is None:
        return sections
    for sec in body.findall(".//sec"):
        title = join_text(sec.find("title"))
        paragraphs = [join_text(paragraph) for paragraph in sec.findall("p") if join_text(paragraph)]
        if paragraphs:
            sections.append({"section": title, "text": f"{title}\n" + "\n\n".join(paragraphs) if title else "\n\n".join(paragraphs)})
    if not sections:
        paragraphs = [join_text(paragraph) for paragraph in body.findall(".//p") if join_text(paragraph)]
        if paragraphs:
            sections.append({"section": "Body", "text": "\n\n".join(paragraphs)})
    return sections


def extract_pmc_references(article: ET.Element) -> list[dict[str, str]]:
    references = []
    for ref in article.findall(".//ref-list/ref"):
        title = join_text(ref.find(".//article-title")) or join_text(ref.find(".//source"))
        source = join_text(ref.find(".//source"))
        year = text_or_empty(ref.find(".//year"))
        doi = ""
        pmid = ""
        for pub_id in ref.findall(".//pub-id"):
            id_type = pub_id.attrib.get("pub-id-type", "")
            if id_type == "doi":
                doi = text_or_empty(pub_id)
            if id_type == "pmid":
                pmid = text_or_empty(pub_id)
        if title or source:
            references.append({"title": title, "source": source, "year": year, "doi": doi, "pmid": pmid})
    return references


def extract_pmc_pub_date(article: ET.Element) -> str:
    pub_date = article.find(".//pub-date")
    if pub_date is None:
        return ""
    year = text_or_empty(pub_date.find("year"))
    month = text_or_empty(pub_date.find("month"))
    day = text_or_empty(pub_date.find("day"))
    return "-".join(part.zfill(2) if index > 0 and part.isdigit() else part for index, part in enumerate([year, month, day]) if part)


def extract_pub_date(article: ET.Element) -> str:
    pub_date = article.find(".//JournalIssue/PubDate")
    if pub_date is None:
        return ""
    year = text_or_empty(pub_date.find("Year"))
    month = text_or_empty(pub_date.find("Month"))
    day = text_or_empty(pub_date.find("Day"))
    return " ".join(part for part in [year, month, day] if part)


def text_or_empty(node: ET.Element | None) -> str:
    if node is None or node.text is None:
        return ""
    return html.unescape(node.text.strip())


def join_text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    return html.unescape("".join(node.itertext()).strip())
