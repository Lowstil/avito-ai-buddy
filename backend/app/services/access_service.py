from copy import deepcopy
from datetime import datetime
from typing import Optional
from app.models.schemas import AccessItem, AccessRequestCreate
from app.core.seed_data import INITIAL_ACCESS_ITEMS

class AccessService:
    def __init__(self):
        self._user_access: dict[str, list[AccessItem]] = {
            "intern_1": deepcopy(INITIAL_ACCESS_ITEMS)
        }

    def get_access_list(self, user_id: str) -> list[AccessItem]:
        items = self._user_access.get(user_id)
        if not items:
            items = deepcopy(INITIAL_ACCESS_ITEMS)
            self._user_access[user_id] = items
        return items

    def request_access(self, user_id: str, payload: AccessRequestCreate) -> AccessItem:
        items = self.get_access_list(user_id)
        for item in items:
            if item.system_key == payload.system_key:
                item.status = "requested"
                item.requested_at = datetime.now()
                return item
        
        # If not present, create a custom requested access
        new_item = AccessItem(
            id=f"acc_{len(items)+1}",
            user_id=user_id,
            system_key=payload.system_key,
            system_name=payload.system_key.replace("_", " ").title(),
            description=payload.justification,
            status="requested",
            requested_at=datetime.now()
        )
        items.append(new_item)
        return new_item

    def grant_access(self, user_id: str, system_key: str) -> Optional[AccessItem]:
        items = self.get_access_list(user_id)
        for item in items:
            if item.system_key == system_key:
                item.status = "active"
                item.granted_at = datetime.now()
                return item
        return None

access_service = AccessService()
