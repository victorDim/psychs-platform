"""
Compatibility Layer for Pydantic v2 and Standard Library Dataclasses
Allows zero-dependency execution across Python 3.10-3.14+ while maintaining Pydantic v2 API.
"""
try:
    from pydantic import BaseModel as _PydanticBaseModel, Field as _PydanticField
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

if HAS_PYDANTIC:
    BaseModel = _PydanticBaseModel
    Field = _PydanticField
else:
    from dataclasses import dataclass, field, asdict, is_dataclass
    from typing import Any, Dict

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def model_dump(self) -> Dict[str, Any]:
            def _convert(obj):
                if isinstance(obj, BaseModel):
                    return obj.model_dump()
                elif isinstance(obj, list):
                    return [_convert(i) for i in obj]
                elif isinstance(obj, dict):
                    return {k: _convert(v) for k, v in obj.items()}
                return obj
            
            res = {}
            for k, v in self.__dict__.items():
                if not k.startswith("_"):
                    res[k] = _convert(v)
            return res

        def dict(self) -> Dict[str, Any]:
            return self.model_dump()

    def Field(default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            return default_factory()
        return default
