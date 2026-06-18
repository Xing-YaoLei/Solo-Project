from __future__ import annotations

import re
from typing import Dict, Any, Callable, Optional
from dataclasses import dataclass, field


@dataclass
class RuleContext:
    stage: Optional[str] = None
    stock_days: int = 0
    documents: Dict[str, str] = field(default_factory=dict)
    extra: Dict[str, Any] = field(default_factory=dict)

    def doc_status(self, doc_type: str) -> str:
        return self.documents.get(doc_type, "missing")


class DSLEvaluator:
    _TOKEN_RE = re.compile(r"\s*(?:(AND|OR|NOT|==|!=|<=|>=|<|>|\(|\)|'[^']*'|\"[^\"]*\"|[A-Za-z_][A-Za-z0-9_]*\([^)]*\)|[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?))")

    _FUNC_MAP: Dict[str, Callable[..., Any]] = {
        "doc_status": lambda ctx, t: ctx.doc_status(t),
        "missing": lambda ctx, t: ctx.doc_status(t) == "missing",
        "present": lambda ctx, t: ctx.doc_status(t) == "present",
        "pending": lambda ctx, t: ctx.doc_status(t) == "pending",
    }

    def tokenize(self, expr: str) -> list:
        tokens: list = []
        pos = 0
        while pos < len(expr):
            m = self._TOKEN_RE.match(expr, pos)
            if not m:
                if not expr[pos].isspace():
                    raise ValueError(f"Unexpected char at {pos}: {expr[pos]!r}")
                pos += 1
                continue
            tok = m.group(1).strip()
            if tok:
                tokens.append(tok)
            pos = m.end()
        return tokens

    def _parse_value(self, tok: str, ctx: RuleContext) -> Any:
        if (tok.startswith("'") and tok.endswith("'")) or (
            tok.startswith('"') and tok.endswith('"')
        ):
            return tok[1:-1]
        if re.fullmatch(r"\d+\.\d+", tok):
            return float(tok)
        if re.fullmatch(r"\d+", tok):
            return int(tok)
        func_match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\((.*)\)", tok)
        if func_match:
            name = func_match.group(1)
            args_raw = func_match.group(2).strip()
            args = []
            if args_raw:
                for a in args_raw.split(","):
                    a = a.strip()
                    if (a.startswith("'") and a.endswith("'")) or (
                        a.startswith('"') and a.endswith('"')
                    ):
                        args.append(a[1:-1])
                    else:
                        args.append(self._resolve_attr(a, ctx))
            fn = self._FUNC_MAP.get(name)
            if fn is None:
                raise ValueError(f"Unknown function: {name}")
            return fn(ctx, *args)
        return self._resolve_attr(tok, ctx)

    def _resolve_attr(self, name: str, ctx: RuleContext) -> Any:
        if name == "stage":
            return ctx.stage
        if name == "stock_days":
            return ctx.stock_days
        return ctx.extra.get(name)

    def evaluate(self, expression: str, context: RuleContext) -> bool:
        tokens = self.tokenize(expression)
        if not tokens:
            return False
        result, _ = self._parse_or(tokens, 0, context)
        return bool(result)

    def _parse_or(self, tokens, pos, ctx):
        left, pos = self._parse_and(tokens, pos, ctx)
        while pos < len(tokens) and tokens[pos] == "OR":
            pos += 1
            right, pos = self._parse_and(tokens, pos, ctx)
            left = bool(left) or bool(right)
        return left, pos

    def _parse_and(self, tokens, pos, ctx):
        left, pos = self._parse_not(tokens, pos, ctx)
        while pos < len(tokens) and tokens[pos] == "AND":
            pos += 1
            right, pos = self._parse_not(tokens, pos, ctx)
            left = bool(left) and bool(right)
        return left, pos

    def _parse_not(self, tokens, pos, ctx):
        if pos < len(tokens) and tokens[pos] == "NOT":
            pos += 1
            val, pos = self._parse_not(tokens, pos, ctx)
            return not bool(val), pos
        return self._parse_cmp(tokens, pos, ctx)

    def _parse_cmp(self, tokens, pos, ctx):
        left, pos = self._parse_atom(tokens, pos, ctx)
        if pos < len(tokens) and tokens[pos] in {"==", "!=", "<=", ">=", "<", ">"}:
            op = tokens[pos]
            pos += 1
            right, pos = self._parse_atom(tokens, pos, ctx)
            if op == "==":
                return left == right, pos
            if op == "!=":
                return left != right, pos
            if op == "<":
                return left < right, pos
            if op == ">":
                return left > right, pos
            if op == "<=":
                return left <= right, pos
            if op == ">=":
                return left >= right, pos
        return left, pos

    def _parse_atom(self, tokens, pos, ctx):
        if pos >= len(tokens):
            raise ValueError("Unexpected end of expression")
        tok = tokens[pos]
        if tok == "(":
            pos += 1
            val, pos = self._parse_or(tokens, pos, ctx)
            if pos >= len(tokens) or tokens[pos] != ")":
                raise ValueError("Missing ')'")
            pos += 1
            return val, pos
        return self._parse_value(tok, ctx), pos + 1


def evaluate_rule(expression: str, context: RuleContext) -> bool:
    evaluator = DSLEvaluator()
    return evaluator.evaluate(expression, context)


__all__ = ["DSLEvaluator", "RuleContext", "evaluate_rule"]
