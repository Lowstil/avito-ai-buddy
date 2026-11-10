#!/usr/bin/env python3
"""
Avito AI-Buddy: Master Automated Verification Suite
Validates that all hackathon requirements, test coverage (>80%), and SDD specs are satisfied.
"""

import subprocess
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_step(step_name, command, cwd=None):
    print(f"\n========================================================")
    print(f"  [RUNNING] {step_name}")
    print(f"========================================================")
    res = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"  [SUCCESS] {step_name}")
        if res.stdout.strip():
            print("\n".join(res.stdout.strip().split("\n")[:10]))
        return True, res.stdout
    else:
        print(f"  [FAILED] {step_name}")
        print(res.stderr or res.stdout)
        return False, res.stderr or res.stdout

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("\n🔍 STARTING AVITO AI-BUDDY VERIFICATION (Hack&Change 2026)\n")

    # Step 1: Check SDD specs
    specs_dir = os.path.join(root_dir, "specs")
    required_specs = [
        "01_system_architecture.md",
        "02_agent_behavior_spec.md",
        "03_mcp_tools_spec.md",
        "04_rbac_security_spec.md",
        "05_metrics_and_evaluation_spec.md"
    ]
    missing_specs = [s for s in required_specs if not os.path.exists(os.path.join(specs_dir, s))]
    if missing_specs:
        print(f"❌ Missing SDD specifications: {missing_specs}")
        sys.exit(1)
    print(f"✅ All {len(required_specs)} SDD specifications verified in specs/")

    # Step 2: Run Pytest & Measure Line Coverage
    ok, out = run_step(
        "Pytest Suite & Code Coverage (>80% required)",
        "py -m pytest --cov=app --cov-report=term-missing",
        cwd=backend_dir
    )
    if not ok:
        print("❌ Pytest tests failed!")
        sys.exit(1)

    # Check for coverage %
    import re
    cov_match = re.search(r"TOTAL\s+\d+\s+\d+\s+(\d+)%", out)
    if cov_match:
        cov_pct = int(cov_match.group(1))
        print(f"📊 Measured Line Coverage: {cov_pct}% (Requirement: >80%)")
        if cov_pct < 80:
            print(f"❌ Coverage {cov_pct}% is below 80% threshold!")
            sys.exit(1)
        print("✅ Coverage threshold exceeded (>80%)!")

    # Step 3: Frontend Build Verification
    ok, out = run_step(
        "Frontend TypeScript & Vite Build",
        "npm run build",
        cwd=frontend_dir
    )
    if not ok:
        print("❌ Frontend build failed!")
        sys.exit(1)
    print("✅ Frontend build verified!")

    print("\n🎉 ALL AUDITS AND GATES PASSED! Solution is ready for competition.\n")

if __name__ == "__main__":
    main()
