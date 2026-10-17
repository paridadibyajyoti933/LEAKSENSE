from typing import Dict, Any, Tuple, Optional
from .config import settings

def calculate_session_score(
    ground_truth: str,
    trainee_diagnosis: str,
    duration_seconds: float,
    difficulty: str,
    hints_used: int = 0,
    attempts: int = 1,
    procedure_compliance: str = "NOT_ASSESSED"
) -> Dict[str, Any]:
    """
    Evaluates trainee diagnostic performance using transparent rubric.
    Never assumes NSQF certification or full score for unassessed compliance.
    """
    # 1. Correctness (0 - 50 points)
    is_correct = (ground_truth.strip().lower() == trainee_diagnosis.strip().lower())
    score_correctness = settings.WEIGHT_CORRECTNESS if is_correct else 0.0

    # 2. Time Score (0 - 20 points)
    target_times = {"easy": 60.0, "medium": 35.0, "hard": 20.0}
    max_times = {"easy": 180.0, "medium": 120.0, "hard": 80.0}
    target = target_times.get(difficulty.lower(), 35.0)
    cutoff = max_times.get(difficulty.lower(), 120.0)

    if duration_seconds <= target:
        score_time = settings.WEIGHT_TIME
    elif duration_seconds >= cutoff:
        score_time = 4.0
    else:
        # Linear decay
        fraction = 1.0 - ((duration_seconds - target) / (cutoff - target))
        score_time = round(4.0 + (fraction * (settings.WEIGHT_TIME - 4.0)), 1)

    if not is_correct:
        score_time = min(score_time, 5.0)

    # 3. Independence Score (0 - 20 points)
    # Deductions for hints and multiple attempts
    indep = settings.WEIGHT_INDEPENDENCE
    indep -= (hints_used * 6.0)
    if attempts > 1:
        indep -= ((attempts - 1) * 4.0)
    score_independence = max(0.0, round(indep, 1))

    # 4. Procedure Compliance (0 or 10 points, or NOT_ASSESSED)
    score_compliance = None
    compliance_weight = 0.0
    if procedure_compliance.upper() == "COMPLIANT":
        score_compliance = settings.WEIGHT_COMPLIANCE
        compliance_weight = settings.WEIGHT_COMPLIANCE
    elif procedure_compliance.upper() == "NON_COMPLIANT":
        score_compliance = 0.0
        compliance_weight = settings.WEIGHT_COMPLIANCE

    # Total Score calculation
    assessed_max = settings.WEIGHT_CORRECTNESS + settings.WEIGHT_TIME + settings.WEIGHT_INDEPENDENCE + compliance_weight
    raw_score = score_correctness + score_time + score_independence + (score_compliance or 0.0)
    normalized_100 = round((raw_score / assessed_max) * 100.0, 1)

    # Performance Category
    if normalized_100 >= 85.0:
        category = "Mastery (Level 4 - Proficient Operator)"
    elif normalized_100 >= 70.0:
        category = "Competent (Level 3 - Independent Diagnostic)"
    elif normalized_100 >= 50.0:
        category = "Developing (Level 2 - Supervised Practice Needed)"
    else:
        category = "Novice (Level 1 - Foundational Remediation Required)"

    # Actionable Improvement Suggestions
    suggestions = []
    if not is_correct:
        if ground_truth in ("Left", "Right"):
            suggestions.append(f"Expected '{ground_truth}'. Remember: Sensor A is near the Left branch (x=35cm); Sensor B is near Right (x=65cm). Always compare RMS ratio before committing.")
        elif ground_truth == "Centre":
            suggestions.append("Expected 'Centre'. In a central leak, vibration energy reaches Sensor A and B equally, but pipe pressure drops significantly.")
        elif ground_truth == "No Leak":
            suggestions.append("Expected 'No Leak'. Verify baseline pressure (>145 kPa) and low uniform vibration before reporting a fault.")

    if duration_seconds > target:
        suggestions.append(f"Diagnosis took {round(duration_seconds, 1)}s. Target for {difficulty} mode is <{target}s. Practice reading the acoustic energy ratio indicator faster.")

    if hints_used > 0:
        suggestions.append(f"Used {hints_used} hint(s). Aim to complete assessment mode without hints to maximize independence score.")

    if procedure_compliance == "NOT_ASSESSED":
        suggestions.append("Procedural compliance was marked 'NOT ASSESSED' by trainer.")

    return {
        "is_correct": is_correct,
        "score_correctness": score_correctness,
        "score_time": score_time,
        "score_independence": score_independence,
        "score_compliance": score_compliance,
        "total_score": normalized_100,
        "performance_category": category,
        "feedback_remarks": " ".join(suggestions)
    }
