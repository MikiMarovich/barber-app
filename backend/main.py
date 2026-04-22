from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from fastapi import HTTPException
from fastapi import Header
import os
from dotenv import load_dotenv
import json

load_dotenv()

# -------------------------
# Conexión a la base
# -------------------------
def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# -------------------------
# App
# -------------------------
app = FastAPI()

# CORS (para conectar con frontend)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    password: str

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")


# -------------------------
# Login
# -------------------------
@app.post("/login")
def login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "token": ADMIN_TOKEN
    }

def verify_admin_token(authorization: str = Header(None)):
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="No autorizado")
    

# -------------------------
# Modelo de datos
# -------------------------
class AppointmentCreate(BaseModel):
    clientName: str
    clientPhone: str
    serviceId: str
    date: str
    time: str

# -------------------------
# Endpoint
# -------------------------
@app.post("/appointments")
def create_appointment(payload: AppointmentCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        check_query = """
        SELECT id
        FROM appointments
        WHERE date = %s
          AND time = %s
          AND status <> 'cancelled'
        LIMIT 1
        """
        cursor.execute(check_query, (payload.date, payload.time))
        existing = cursor.fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Ese horario ya está ocupado")

        insert_query = """
        INSERT INTO appointments (
            client_name,
            client_phone,
            service_id,
            date,
            time,
            status
        )
        VALUES (%s, %s, %s, %s, %s, 'pending')
        """
        cursor.execute(
            insert_query,
            (
                payload.clientName,
                payload.clientPhone,
                payload.serviceId,
                payload.date,
                payload.time,
            )
        )
        conn.commit()

        return {"message": "Turno creado correctamente"}

    finally:
        cursor.close()
        conn.close()


@app.get("/appointments")
def get_appointments():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT
            a.id,
            a.client_name,
            a.client_phone,
            a.service_id,
            a.date,
            a.time,
            a.status,
            a.payment_method,
            a.staff_id,
            s.name AS staff_name
        FROM appointments a
        LEFT JOIN staff s ON a.staff_id = s.id
        ORDER BY a.date DESC, a.time DESC
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return results

    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.put("/appointments/{id}")
def update_appointment(id: int, appointment: dict, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE appointments
        SET date = %s,
          time = %s,
          service_id = %s
        WHERE id = %s
        """

        cursor.execute(query, (
            appointment["date"],
            appointment["time"],
            appointment["service_id"],
            id
        ))

        conn.commit()

        return {"message": "Turno actualizado"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()


@app.put("/appointments/{id}/cancel")
def cancel_appointment(id: int, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE appointments
        SET status = 'cancelled'
        WHERE id = %s
        """

        cursor.execute(query, (id,))
        conn.commit()

        return {"message": "Turno cancelado"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()

class CompleteAppointmentRequest(BaseModel):
    payment_method: str
    staff_id: int

@app.put("/appointments/{id}/complete")
def complete_appointment(id: int, payload: CompleteAppointmentRequest, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE appointments
        SET status = 'completed',
            payment_method = %s,
            staff_id = %s,
            completed_at = NOW()
        WHERE id = %s
        """
        cursor.execute(query, (
            payload.payment_method,
            payload.staff_id,
            id
        ))
        conn.commit()

        return {"message": "Turno completado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


# -------------------------
# cancelación de dias
# -------------------------

class BlockedDate(BaseModel):
    blocked_date: str
    reason: Optional[str] = None

@app.get("/blocked-dates")
def get_blocked_dates():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM blocked_dates ORDER BY blocked_date ASC"
        cursor.execute(query)
        results = cursor.fetchall()

        return results
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.post("/blocked-dates")
def create_blocked_date(blocked: BlockedDate, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO blocked_dates (blocked_date, reason)
        VALUES (%s, %s)
        """
        cursor.execute(query, (blocked.blocked_date, blocked.reason))
        conn.commit()

        return {"message": "Fecha bloqueada correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.delete("/blocked-dates/{id}")
def delete_blocked_date(id: int, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = "DELETE FROM blocked_dates WHERE id = %s"
        cursor.execute(query, (id,))
        conn.commit()

        return {"message": "Fecha desbloqueada correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


class BlockedSlot(BaseModel):
    blocked_date: str
    blocked_time: str
    reason: str | None = None

@app.get("/blocked-slots")
def get_blocked_slots():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT * FROM blocked_slots
        ORDER BY blocked_date ASC, blocked_time ASC
        """
        cursor.execute(query)
        results = cursor.fetchall()

        return results
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.post("/blocked-slots")
def create_blocked_slot(blocked: BlockedSlot, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO blocked_slots (blocked_date, blocked_time, reason)
        VALUES (%s, %s, %s)
        """
        cursor.execute(
            query,
            (blocked.blocked_date, blocked.blocked_time, blocked.reason)
        )
        conn.commit()

        return {"message": "Horario bloqueado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.delete("/blocked-slots/{id}")
def delete_blocked_slot(id: int, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = "DELETE FROM blocked_slots WHERE id = %s"
        cursor.execute(query, (id,))
        conn.commit()

        return {"message": "Horario desbloqueado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.get("/staff")
def get_staff():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT id, name FROM staff WHERE active = TRUE ORDER BY name"
        cursor.execute(query)
        results = cursor.fetchall()

        return results
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

class CompleteAppointmentRequest(BaseModel):
    payment_method: str
    staff_id: int


# -------------------------
# inventario
# -------------------------

class SellProductRequest(BaseModel):
    product_id: int
    quantity: int
    staff_id: int

@app.post("/inventory/sell")
def sell_product(payload: SellProductRequest, authorization: str = Header(None)):
    verify_admin_token(authorization)
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT quantity FROM inventory WHERE id = %s",
            (payload.product_id,)
        )
        product = cursor.fetchone()

        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        if product["quantity"] < payload.quantity:
            raise HTTPException(status_code=400, detail="Stock insuficiente")

        cursor.execute(
            """
            UPDATE inventory
            SET quantity = quantity - %s
            WHERE id = %s
            """,
            (payload.quantity, payload.product_id)
        )

        cursor.execute(
            """
            INSERT INTO inventory_sales (product_id, quantity, staff_id)
            VALUES (%s, %s, %s)
            """,
            (payload.product_id, payload.quantity, payload.staff_id)
        )

        conn.commit()
        return {"message": "Venta registrada correctamente"}

    finally:
        cursor.close()
        conn.close()

class InventoryItemCreate(BaseModel):
    name: str
    quantity: int
    minStock: int
    price: float

class SellProductRequest(BaseModel):
    product_id: int
    quantity: int
    staff_id: int


@app.get("/inventory")
def get_inventory(authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM inventory ORDER BY name ASC")
        results = cursor.fetchall()
        return results

    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.post("/inventory")
def create_inventory_item(payload: InventoryItemCreate, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO inventory (name, quantity, min_stock, price)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (
            payload.name,
            payload.quantity,
            payload.minStock,
            payload.price
        ))
        conn.commit()

        return {"message": "Producto creado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.put("/inventory/{id}")
def update_inventory_item(id: int, payload: InventoryItemCreate, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE inventory
        SET name = %s,
            quantity = %s,
            min_stock = %s,
            price = %s
        WHERE id = %s
        """
        cursor.execute(query, (
            payload.name,
            payload.quantity,
            payload.minStock,
            payload.price,
            id
        ))
        conn.commit()

        return {"message": "Producto actualizado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.delete("/inventory/{id}")
def delete_inventory_item(id: int, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM inventory WHERE id = %s", (id,))
        conn.commit()

        return {"message": "Producto eliminado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.get("/inventory/sales")
def get_inventory_sales(
    month: Optional[int] = None,
    year: Optional[int] = None,
    staff_id: Optional[int] = None,
    authorization: str = Header(None)
):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT
            s.id,
            s.product_id,
            i.name AS product_name,
            s.quantity,
            s.staff_id,
            st.name AS staff_name,
            s.sold_at
        FROM inventory_sales s
        LEFT JOIN inventory i ON s.product_id = i.id
        LEFT JOIN staff st ON s.staff_id = st.id
        WHERE 1=1
        """
        params = []

        if month is not None:
            query += " AND MONTH(s.sold_at) = %s"
            params.append(month)

        if year is not None:
            query += " AND YEAR(s.sold_at) = %s"
            params.append(year)

        if staff_id is not None:
            query += " AND s.staff_id = %s"
            params.append(staff_id)

        query += " ORDER BY s.sold_at DESC"

        cursor.execute(query, tuple(params))
        results = cursor.fetchall()

        return results

    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.get("/services")
def get_services():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT id, name, price, duration, active
        FROM services
        WHERE active = TRUE
        ORDER BY id ASC
        """
        cursor.execute(query)
        results = cursor.fetchall()

        return results

    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()


@app.get("/settings")
def get_settings():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT
            working_hour_start,
            working_hour_end,
            working_days,
            slot_duration
        FROM barber_settings
        ORDER BY id DESC
        LIMIT 1
        """
        cursor.execute(query)
        result = cursor.fetchone()

        if not result:
            return {
                "workingHours": {
                    "start": "10:30",
                    "end": "21:00"
                },
                "workingDays": [2, 3, 4, 5, 6],
                "slotDuration": 30,
                "weeklySchedule": {
                    "2": [
                        {"start": "10:30", "end": "14:00"},
                        {"start": "17:00", "end": "21:00"}
                    ],
                    "3": [
                        {"start": "10:30", "end": "14:00"},
                        {"start": "17:00", "end": "21:00"}
                    ],
                    "4": [
                        {"start": "10:30", "end": "14:00"},
                        {"start": "17:00", "end": "21:00"}
                    ],
                    "5": [
                        {"start": "10:30", "end": "21:00"}
                    ],
                    "6": [
                        {"start": "10:30", "end": "21:00"}
                    ]
                }
            }

        weekly_schedule = {}
        if result.get("weekly_schedule"):
            weekly_schedule = json.loads(result["weekly_schedule"])

        return {
            "workingHours": {
                "start": result["working_hour_start"],
                "end": result["working_hour_end"]
            },
            "workingDays": [int(x) for x in result["working_days"].split(",") if x != ""],
            "slotDuration": result["slot_duration"],
            "weeklySchedule": weekly_schedule
        }

    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

class ServicePayload(BaseModel):
    name: str
    price: float
    duration: int
    active: bool = True

class SettingsPayload(BaseModel):
    workingHours: dict
    workingDays: list[int]
    slotDuration: int
    weeklySchedule: dict | None = None

@app.post("/services")
def create_service(payload: ServicePayload, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO services (name, price, duration, active)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (
            payload.name,
            payload.price,
            payload.duration,
            payload.active
        ))
        conn.commit()

        return {"message": "Servicio creado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.put("/services/{id}")
def update_service(id: int, payload: ServicePayload, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE services
        SET name = %s,
            price = %s,
            duration = %s,
            active = %s
        WHERE id = %s
        """
        cursor.execute(query, (
            payload.name,
            payload.price,
            payload.duration,
            payload.active,
            id
        ))
        conn.commit()

        return {"message": "Servicio actualizado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.delete("/services/{id}")
def delete_service(id: int, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = "DELETE FROM services WHERE id = %s"
        cursor.execute(query, (id,))
        conn.commit()

        return {"message": "Servicio eliminado correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.put("/settings")
def update_settings(payload: SettingsPayload, authorization: str = Header(None)):
    verify_admin_token(authorization)
    try:
        conn = get_connection()
        cursor = conn.cursor()

        working_days_str = ",".join(str(x) for x in payload.workingDays)

        weekly_schedule_json = json.dumps(payload.weeklySchedule or {})

        query = """
        UPDATE barber_settings
        SET working_hour_start = %s,
            working_hour_end = %s,
            working_days = %s,
            slot_duration = %s,
            weekly_schedule = %s
        ORDER BY id DESC
        LIMIT 1
        """
        cursor.execute(query, (
            payload.workingHours["start"],
            payload.workingHours["end"],
            working_days_str,
            payload.slotDuration,
            weekly_schedule_json
        ))
        conn.commit()

        return {"message": "Configuración actualizada correctamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()