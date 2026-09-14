"""
AST-Level HTML Sanitizer & Zero-Trust Normalization Engine
Strips hidden CSS, zero-point typography, off-screen text, zero-width Unicode,
and indirect prompt injection vectors using robust AST & DOM pruning.
"""
import re
import unicodedata
from html.parser import HTMLParser
from typing import Dict, Any, List, Tuple
from ..compat import BaseModel, Field

class SanitizationResult(BaseModel):
    cleaned_html: str
    extracted_text: str
    tokens_pruned: int
    zero_point_elements_removed: int
    hidden_css_elements_removed: int
    offscreen_elements_removed: int
    unicode_anomalies_cleaned: int
    injection_threats_detected: List[str] = Field(default_factory=list)
    is_safe: bool = True

class DOMNode:
    def __init__(self, tag: str, attrs: Dict[str, str], parent=None):
        self.tag = tag.lower()
        self.attrs = attrs
        self.parent = parent
        self.children: List[Any] = []
        self.is_pruned = False

class DOMTreeParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = DOMNode("root", {})
        self.current = self.root

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        node = DOMNode(tag, attr_dict, parent=self.current)
        self.current.children.append(node)
        if tag.lower() not in ["br", "hr", "img", "input", "meta", "link"]:
            self.current = node

    def handle_endtag(self, tag):
        if self.current.parent is not None and self.current.tag == tag.lower():
            self.current = self.current.parent

    def handle_data(self, data):
        self.current.children.append(data)

class ASTSanitizer:
    # Zero-width & invisible Unicode markers
    ZERO_WIDTH_CHARS = [
        '\u200b',  # Zero Width Space
        '\u200c',  # Zero Width Non-Joiner
        '\u200d',  # Zero Width Joiner
        '\ufeff',  # Byte Order Mark / Zero Width No-Break Space
        '\u2060',  # Word Joiner
        '\u00ad',  # Soft Hyphen
    ]
    
    # Prompt injection heuristic patterns (e.g. system instructions hidden in HTML)
    INJECTION_PATTERNS = [
        r"ignore (all )?previous instructions",
        r"system prompt override",
        r"you are now an unfiltered",
        r"as an ai model, disregard",
        r"<\|im_start\|>",
        r"<\|im_end\|>",
        r"\[SYSTEM_INSTRUCTION\]",
    ]

    DANGEROUS_TAGS = {"script", "style", "iframe", "noscript", "meta", "link", "svg"}

    @classmethod
    def sanitize(cls, raw_html: str) -> SanitizationResult:
        """
        Executes zero-trust AST parsing and pruning on input HTML.
        """
        zero_point_count = 0
        hidden_css_count = 0
        offscreen_count = 0
        unicode_cleaned_count = 0
        injection_threats = []

        parser = DOMTreeParser()
        parser.feed(raw_html)

        extracted_text_chunks: List[str] = []

        def traverse(node: DOMNode):
            nonlocal zero_point_count, hidden_css_count, offscreen_count

            if node.tag in cls.DANGEROUS_TAGS:
                node.is_pruned = True
                return

            style = node.attrs.get("style", "").lower().replace(" ", "")
            cls_name = node.attrs.get("class", "").lower()

            # Zero-point typography check
            if any(rule in style for rule in ["font-size:0", "font-size:0px", "font-size:0pt", "line-height:0", "line-height:0px"]):
                zero_point_count += 1
                node.is_pruned = True
                return

            # Hidden CSS check
            if any(rule in style for rule in ["display:none", "visibility:hidden", "opacity:0", "opacity:0.0"]):
                hidden_css_count += 1
                node.is_pruned = True
                return
                
            if any(c in cls_name for c in ["hidden", "invisible"]):
                hidden_css_count += 1
                node.is_pruned = True
                return

            # Off-screen positioning check
            if re.search(r"left:-[0-9]{3,5}px", style) or re.search(r"top:-[0-9]{3,5}px", style) or "left:-1000vw" in style:
                offscreen_count += 1
                node.is_pruned = True
                return

            for child in node.children:
                if isinstance(child, str):
                    if not node.is_pruned:
                        extracted_text_chunks.append(child)
                elif isinstance(child, DOMNode):
                    if not node.is_pruned:
                        traverse(child)

        traverse(parser.root)

        raw_extracted = " ".join(extracted_text_chunks)

        # 5. Unicode normalization and zero-width sanitization
        cleaned_chars = []
        for ch in raw_extracted:
            if ch in cls.ZERO_WIDTH_CHARS:
                unicode_cleaned_count += 1
            else:
                cleaned_chars.append(ch)
        
        normalized_text = "".join(cleaned_chars)
        # Normalize NFKC to resolve homoglyphs
        normalized_text = unicodedata.normalize("NFKC", normalized_text)
        # Collapse multiple whitespaces
        normalized_text = re.sub(r"\s+", " ", normalized_text).strip()

        # 6. Indirect prompt injection scanning
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, normalized_text, re.IGNORECASE):
                injection_threats.append(f"Prompt injection signature match: '{pattern}'")

        is_safe = len(injection_threats) == 0
        total_pruned = zero_point_count + hidden_css_count + offscreen_count

        return SanitizationResult(
            cleaned_html=normalized_text,
            extracted_text=normalized_text,
            tokens_pruned=total_pruned,
            zero_point_elements_removed=zero_point_count,
            hidden_css_elements_removed=hidden_css_count,
            offscreen_elements_removed=offscreen_count,
            unicode_anomalies_cleaned=unicode_cleaned_count,
            injection_threats_detected=injection_threats,
            is_safe=is_safe
        )
