import asyncio
import logging
from datetime import datetime, date, timezone, timedelta
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayflow.seed")

async def seed_data():
    logger.info("Starting Dayflow DB Seeder...")
    await connect_to_mongo()
    db = get_database()
    
    # 1. Clear existing sample collections for clean seed
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.attendance.delete_many({})
    await db.leave_requests.delete_many({})
    await db.payroll_slips.delete_many({})
    await db.activity_feed.delete_many({})
    await db.notifications.delete_many({})
    
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    
    # 2. Create Admin User & Profile
    admin_user = {
        "employee_id": "EMP1000",
        "email": "admin@dayflow.com",
        "password_hash": hash_password("Admin@1234"),
        "role": "admin",
        "is_email_verified": True,
        "is_active": True,
        "created_at": now
    }
    await db.users.insert_one(admin_user)
    
    admin_emp = {
        "employee_id": "EMP1000",
        "personal_details": {
            "full_name": "Sarah Connor (HR Admin)",
            "phone": "+1 555-0199",
            "address": "100 Tech Blvd, Suite 400, San Francisco, CA",
            "dob": "1988-05-14",
            "profile_picture_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        },
        "job_details": {
            "department": "Human Resources",
            "designation": "HR Director",
            "date_of_joining": "2022-01-10",
            "manager_id": ""
        },
        "salary_structure": {
            "basic": 90000.0,
            "hra": 35000.0,
            "allowances": 15000.0,
            "deductions": 8000.0,
            "currency": "INR"
        },
        "documents": [
            {"name": "Employment_Contract.pdf", "url": "#", "uploaded_at": now}
        ],
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await db.employees.insert_one(admin_emp)

    # 3. Create Sample Employees
    sample_employees = [
        {
            "employee_id": "EMP1001",
            "email": "jane@company.com",
            "password": "Employee@1234",
            "name": "Jane Doe",
            "phone": "+1 555-0101",
            "address": "42 Market Street, San Jose, CA",
            "dob": "1994-08-20",
            "department": "Engineering",
            "designation": "Senior Full-Stack Lead",
            "pic": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            "basic": 75000.0,
            "hra": 30000.0,
            "allowances": 12000.0,
            "deductions": 6000.0
        },
        {
            "employee_id": "EMP1002",
            "email": "john@company.com",
            "password": "Employee@1234",
            "name": "John Smith",
            "phone": "+1 555-0102",
            "address": "128 Mission St, San Francisco, CA",
            "dob": "1992-03-12",
            "department": "Engineering",
            "designation": "Backend Engineer",
            "pic": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "basic": 60000.0,
            "hra": 24000.0,
            "allowances": 10000.0,
            "deductions": 5000.0
        },
        {
            "employee_id": "EMP1003",
            "email": "alice@company.com",
            "password": "Employee@1234",
            "name": "Alice Johnson",
            "phone": "+1 555-0103",
            "address": "742 Evergreen Terrace, Springfield",
            "dob": "1996-11-05",
            "department": "Design",
            "designation": "UI/UX Product Designer",
            "pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            "basic": 55000.0,
            "hra": 22000.0,
            "allowances": 9000.0,
            "deductions": 4500.0
        },
        {
            "employee_id": "EMP1004",
            "email": "bob@company.com",
            "password": "Employee@1234",
            "name": "Bob Wilson",
            "phone": "+1 555-0104",
            "address": "55 Castro St, Mountain View, CA",
            "dob": "1991-07-22",
            "department": "Marketing",
            "designation": "Growth Marketing Manager",
            "pic": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            "basic": 50000.0,
            "hra": 20000.0,
            "allowances": 8000.0,
            "deductions": 4000.0
        }
    ]

    for emp in sample_employees:
        user_doc = {
            "employee_id": emp["employee_id"],
            "email": emp["email"],
            "password_hash": hash_password(emp["password"]),
            "role": "employee",
            "is_email_verified": True,
            "is_active": True,
            "created_at": now
        }
        await db.users.insert_one(user_doc)
        
        emp_doc = {
            "employee_id": emp["employee_id"],
            "personal_details": {
                "full_name": emp["name"],
                "phone": emp["phone"],
                "address": emp["address"],
                "dob": emp["dob"],
                "profile_picture_url": emp["pic"]
            },
            "job_details": {
                "department": emp["department"],
                "designation": emp["designation"],
                "date_of_joining": "2023-04-15",
                "manager_id": "EMP1000"
            },
            "salary_structure": {
                "basic": emp["basic"],
                "hra": emp["hra"],
                "allowances": emp["allowances"],
                "deductions": emp["deductions"],
                "currency": "INR"
            },
            "documents": [
                {"name": "Offer_Letter.pdf", "url": "#", "uploaded_at": now},
                {"name": "ID_Proof.pdf", "url": "#", "uploaded_at": now}
            ],
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        await db.employees.insert_one(emp_doc)

    # 4. Generate Attendance History for the current month up to today
    today_day = now.day
    all_emp_ids = ["EMP1000", "EMP1001", "EMP1002", "EMP1003", "EMP1004"]
    
    for day in range(1, today_day + 1):
        d_str = f"{current_month}-{day:02d}"
        for emp_id in all_emp_ids:
            # Skip weekend days for realistic simulation
            day_obj = datetime.strptime(d_str, "%Y-%m-%d")
            if day_obj.weekday() in [5, 6]:
                continue
                
            # Random status distribution
            if day == 5 and emp_id == "EMP1002":
                st = "Half-day"
                wh = 4.5
            elif day == 10 and emp_id == "EMP1001":
                st = "Leave"
                wh = 0.0
            else:
                st = "Present"
                wh = 8.5
                
            checkin_time = datetime(day_obj.year, day_obj.month, day_obj.day, 9, 0, 0, tzinfo=timezone.utc)
            checkout_time = checkin_time + timedelta(hours=wh) if wh > 0 else None
            
            att_doc = {
                "employee_id": emp_id,
                "date": d_str,
                "check_in": checkin_time if wh > 0 else None,
                "check_out": checkout_time,
                "status": st,
                "source": "check-in" if st != "Leave" else "auto-leave-sync",
                "work_hours": wh,
                "updated_at": now
            }
            await db.attendance.insert_one(att_doc)

    # 5. Insert Sample Leave Requests
    sample_leaves = [
        {
            "employee_id": "EMP1001",
            "employee_name": "Jane Doe",
            "leave_type": "paid",
            "start_date": f"{current_month}-10",
            "end_date": f"{current_month}-10",
            "days_count": 1,
            "remarks": "Annual personal day off",
            "status": "Approved",
            "reviewed_by": "EMP1000",
            "admin_comments": "Approved. Enjoy your day off!",
            "created_at": now - timedelta(days=12),
            "updated_at": now - timedelta(days=11)
        },
        {
            "employee_id": "EMP1002",
            "employee_name": "John Smith",
            "leave_type": "sick",
            "start_date": f"{current_month}-25",
            "end_date": f"{current_month}-26",
            "days_count": 2,
            "remarks": "Fever & recovery doctor note",
            "status": "Pending",
            "reviewed_by": None,
            "admin_comments": "",
            "created_at": now - timedelta(days=1),
            "updated_at": now - timedelta(days=1)
        },
        {
            "employee_id": "EMP1003",
            "employee_name": "Alice Johnson",
            "leave_type": "unpaid",
            "start_date": f"{current_month}-28",
            "end_date": f"{current_month}-29",
            "days_count": 2,
            "remarks": "Personal travel extension",
            "status": "Pending",
            "reviewed_by": None,
            "admin_comments": "",
            "created_at": now,
            "updated_at": now
        }
    ]
    await db.leave_requests.insert_many(sample_leaves)

    # 6. Insert Activity Feed items
    activities = [
        {"employee_id": "EMP1001", "employee_name": "Jane Doe", "type": "leave_applied", "message": "Applied for paid leave", "created_at": now - timedelta(days=2)},
        {"employee_id": "EMP1001", "employee_name": "Jane Doe", "type": "leave_approved", "message": "Leave request approved by Admin", "created_at": now - timedelta(days=1)},
        {"employee_id": "EMP1002", "employee_name": "John Smith", "type": "attendance_marked", "message": "Checked in for today", "created_at": now - timedelta(hours=3)},
    ]
    await db.activity_feed.insert_many(activities)

    logger.info("Dayflow Seeding Completed Successfully!")
    logger.info("Credentials Created:")
    logger.info("  Admin:    admin@dayflow.com  / Admin@1234")
    logger.info("  Employee: jane@company.com   / Employee@1234")
    logger.info("  Employee: john@company.com   / Employee@1234")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_data())
