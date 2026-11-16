import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import app

GOOD = dict(age=46, sex="Female", height=160, weight=65, waist=75, rhr=70, sbp=125, dbp=78, activity=5, sleep=7.2)

class ApiTests(unittest.TestCase):
    def setUp(self): self.c = app.test_client()

    def test_health(self):
        self.assertEqual(self.c.get("/api/health").get_json()["status"], "ok")

    def test_metrics_use_loocv_and_real_data(self):
        m = self.c.get("/api/metrics").get_json()
        self.assertEqual(m["n"], 28); self.assertEqual(m["validation"], "leave-one-out")
        for t in m["targets"].values():
            self.assertIn("baseline", t); self.assertTrue(all("r2" in r for r in t["results"]))

    def test_predict_ok(self):
        r = self.c.post("/api/predict", json=GOOD); self.assertEqual(r.status_code, 200)
        p = r.get_json()["predictions"]
        for k in ("mwt", "vo2"):
            self.assertLess(p[k]["low"], p[k]["value"]); self.assertLess(p[k]["value"], p[k]["high"])

    def test_interval_is_loocv_based(self):
        m = self.c.get("/api/metrics").get_json()
        p = self.c.post("/api/predict", json=GOOD).get_json()["predictions"]["mwt"]
        rmse = next(r["rmse"] for r in m["targets"]["mwt"]["results"] if r["model"] == m["targets"]["mwt"]["best"])
        self.assertAlmostEqual(p["high"] - p["value"], 1.28 * rmse, delta=0.2)

    def test_rejects_bad_input(self):
        self.assertEqual(self.c.post("/api/predict", json={}).status_code, 422)
        self.assertEqual(self.c.post("/api/predict", json={**GOOD, "age": 5}).status_code, 422)
        self.assertEqual(self.c.post("/api/predict", json={**GOOD, "sex": "x"}).status_code, 422)

    def test_waist_minimum_is_20_cm(self):
        self.assertEqual(self.c.post("/api/predict", json={**GOOD, "waist": 34}).status_code, 200)
        self.assertEqual(self.c.post("/api/predict", json={**GOOD, "waist": 20}).status_code, 200)
        self.assertEqual(self.c.post("/api/predict", json={**GOOD, "waist": 19}).status_code, 422)

    def test_out_of_range_warns(self):
        r = self.c.post("/api/predict", json={**GOOD, "age": 75}).get_json()
        self.assertTrue(r["warnings"])

if __name__ == "__main__":
    unittest.main()
