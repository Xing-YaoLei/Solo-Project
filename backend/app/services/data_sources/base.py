from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class DataSourceConnector(ABC):
    @abstractmethod
    def get_name(self) -> str:
        pass

    @abstractmethod
    def fetch_data(self, **kwargs) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_sync_status(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def sync_data(self, **kwargs) -> Dict[str, Any]:
        pass


class DataSourceRegistry:
    _sources: Dict[str, DataSourceConnector] = {}

    @classmethod
    def register(cls, source: DataSourceConnector):
        cls._sources[source.get_name()] = source

    @classmethod
    def get_source(cls, name: str) -> Optional[DataSourceConnector]:
        return cls._sources.get(name)

    @classmethod
    def get_all_sources(cls) -> List[str]:
        return list(cls._sources.keys())

    @classmethod
    def get_all_status(cls) -> List[Dict[str, Any]]:
        return [
            {
                "source": name,
                **source.get_sync_status()
            }
            for name, source in cls._sources.items()
        ]
