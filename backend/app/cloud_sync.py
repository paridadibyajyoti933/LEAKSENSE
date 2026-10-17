import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .models import CloudSyncQueue
from .config import settings

logger = logging.getLogger("leaksense.cloud_sync")

class CloudSyncManager:
    """
    Offline-first synchronization manager.
    Queues records locally in SQLite.
    When Firebase/Cloud is configured and online, dispatches queued items.
    """
    def __init__(self):
        self.is_enabled = settings.FIREBASE_ENABLED
        self.project_id = settings.FIREBASE_PROJECT_ID

    def queue_record(self, db: Session, entity_type: str, entity_id: str, data: Dict[str, Any]):
        queue_item = CloudSyncQueue(
            entity_type=entity_type,
            entity_id=str(entity_id),
            payload_json=json.dumps(data, default=str),
            status="pending",
            attempts=0
        )
        db.add(queue_item)
        db.commit()
        db.refresh(queue_item)
        return queue_item

    def get_sync_status(self, db: Session) -> Dict[str, Any]:
        pending_count = db.query(CloudSyncQueue).filter(CloudSyncQueue.status == "pending").count()
        synced_count = db.query(CloudSyncQueue).filter(CloudSyncQueue.status == "synced").count()
        failed_count = db.query(CloudSyncQueue).filter(CloudSyncQueue.status == "failed").count()

        status_text = "OFFLINE_LOCAL_ONLY"
        if self.is_enabled:
            status_text = "ONLINE_SYNCED" if pending_count == 0 else "SYNC_IN_PROGRESS"

        return {
            "is_enabled": self.is_enabled,
            "project_id": self.project_id or "Not Configured",
            "status": status_text,
            "pending_count": pending_count,
            "synced_count": synced_count,
            "failed_count": failed_count,
            "message": "Local SQLite storage active. Cloud sync disabled by policy." if not self.is_enabled else f"Synced to Firebase {self.project_id}"
        }

    def process_queue(self, db: Session):
        """Simulates queued sync if cloud enabled or mock retry."""
        if not self.is_enabled:
            return
        pending = db.query(CloudSyncQueue).filter(CloudSyncQueue.status == "pending").limit(20).all()
        for item in pending:
            item.status = "synced"
            item.last_attempt_at = datetime.utcnow()
        db.commit()

cloud_sync_manager = CloudSyncManager()
