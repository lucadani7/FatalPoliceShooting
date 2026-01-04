# Fatal Police Shooting
A professional Full-Stack application designed to monitor, visualize, and analyze data regarding fatal police shootings in the United States of America. The data is automatically synchronized from the official Washington Post repository.

## 🚀 Hybrid Architecture
This project is organized as a **monorepo**, utilizing a hybrid infrastructure to balance development efficiency with production-grade stability:

- **Frontend:** Next.js (Deployed on **Vercel**)
- **Backend:** FastAPI / Python (Deployed on **Render**)
- **Database:** PostgreSQL 
  - **Production:** Managed by **Supabase** for 24/7 cloud availability.
  - **Local Development:** Isolated environment using **Docker Compose**.

## 🛠️ Tech Stack
- **Python (FastAPI & SQLAlchemy):** Handles data processing and provides the update API.
- **Next.js:** Powering the user interface and interactive data visualizations.
- **Pandas:** Efficiently parsing and cleaning large-scale CSV data from the Washington Post.
- **Vercel Cron:** Automating the daily data synchronization pipeline.

## 🔄 Automated Data Pipeline (CRON)
The database stays up-to-date without manual intervention. Every 24 hours, a **Vercel Cron Job** triggers a secured endpoint in the FastAPI backend which:
1. Fetches the latest CSV data from the Washington Post GitHub repository.
2. Cleans and validates the records using Pandas.
3. Synchronizes the data with the Supabase PostgreSQL instance.

## 💻 Local Setup
This project requires **Docker** and **Docker Compose** to manage the database environment consistently. If you don't have Docker installed locally, you can download it from here: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Clone the repository:
   ```bash
   git clone https://github.com/lucadani7/FatalPoliceShooting
   cd FatalPoliceShooting
   ```
2. Configure environment variables, copying the .env_example file to a new file named .env:
   ```bash
   cp .env_example .env
   ```
3. Start the Database (Docker):
   ```bash
   docker-compose up -d
   ```
4. Choose your environment manager:
   - Option A: Conda
   
     ```bash
     cd backend
     conda create --name shootings-env python=3.10 -y
     conda activate shootings-env
     pip install -r requirements.txt
     uvicorn main:app --reload
     ```
   - Option B: venv

     ```bash
     cd backend
     python -m venv venv
     # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
     pip install -r requirements.txt
     uvicorn main:app --reload
     ```
5. Frontend Setup:
   ```bash
    cd ../frontend
    npm install
    npm run dev
   ```

## 🔒 Security
All sensitive information is managed through Environment Variables and is strictly excluded from version control via .gitignore.

## ## 📄 License

This project is licensed under the Apache-2.0 License.
