from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Device
from ..schemas import DeviceRegister, DeviceHeartbeat, DeviceResponse

router = APIRouter(prefix="/api/devices", tags=["devices"])

@router.get("", response_model=List[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).order_by(Device.created_at.desc()).all()

@router.post("/register", response_model=DeviceResponse)
def register_device(dev_in: DeviceRegister, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == dev_in.device_id).first()
    if dev:
        dev.name = dev_in.name
        dev.firmware_version = dev_in.firmware_version or dev.firmware_version
        dev.model_version = dev_in.model_version or dev.model_version
        dev.ip_or_port = dev_in.ip_or_port or dev.ip_or_port
        dev.status = "connected"
        dev.last_heartbeat = datetime.utcnow()
    else:
        dev = Device(
            device_id=dev_in.device_id,
            name=dev_in.name,
            status="connected",
            firmware_version=dev_in.firmware_version or "1.0.0-unoq",
            model_version=dev_in.model_version or "rf-acoustic-v1",
            ip_or_port=dev_in.ip_or_port,
            last_heartbeat=datetime.utcnow()
        )
        db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev

@router.post("/heartbeat")
def device_heartbeat(hb: DeviceHeartbeat, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == hb.device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    dev.last_heartbeat = datetime.utcnow()
    dev.status = hb.status
    db.commit()
    return {"status": "ok", "timestamp": dev.last_heartbeat.isoformat()}

@router.post("/{device_id}/disconnect")
def disconnect_device(device_id: str, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    dev.status = "disconnected"
    db.commit()
    return {"status": "disconnected", "device_id": device_id}
