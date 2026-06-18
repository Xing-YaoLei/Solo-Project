import functools
import operator
import sqlalchemy.util.typing as _sa_typing

if not hasattr(_sa_typing, "_mp0332_patched"):
    _sa_typing.make_union_type = lambda *types: functools.reduce(operator.or_, types)
    _sa_typing._mp0332_patched = True
