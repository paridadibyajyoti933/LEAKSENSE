import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_session_pdf(session_data: dict, trainee_data: dict) -> bytes:
    """
    Generates a professional LEAKSENSE individual diagnostic assessment report PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0f2d59'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#008080'),
        spaceAfter=14
    )
    section_style = ParagraphStyle(
        'DocSection',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=colors.HexColor('#0f2d59'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13
    )

    # Header
    story.append(Paragraph("LEAKSENSE", title_style))
    story.append(Paragraph("INTELLIGENT DIAGNOSTIC TRAINING & SKILL ASSESSMENT PLATFORM", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f2d59'), spaceAfter=14))

    # Meta Table
    meta_data = [
        [
            Paragraph("<b>Session Code:</b> " + str(session_data.get('session_code', 'N/A')), body_style),
            Paragraph("<b>Date:</b> " + str(session_data.get('completed_at', datetime.utcnow().strftime('%Y-%m-%d %H:%M'))), body_style)
        ],
        [
            Paragraph("<b>Trainee ID:</b> " + str(trainee_data.get('trainee_id', 'N/A')), body_style),
            Paragraph("<b>Full Name:</b> " + str(trainee_data.get('full_name', 'N/A')), body_style)
        ],
        [
            Paragraph("<b>Centre:</b> " + str(trainee_data.get('iti_centre', 'N/A')), body_style),
            Paragraph("<b>Trade & Batch:</b> " + f"{trainee_data.get('trade', 'Plumber')} ({trainee_data.get('batch', '2025-26')})", body_style)
        ],
        [
            Paragraph("<b>Session Type:</b> " + str(session_data.get('session_type', 'assessment')).upper(), body_style),
            Paragraph("<b>Difficulty:</b> " + str(session_data.get('difficulty', 'medium')).capitalize(), body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Diagnostic Results Section
    story.append(Paragraph("Diagnostic Evaluation & Comparison", section_style))
    
    is_correct = session_data.get('is_correct', False)
    result_badge = "CORRECT PASS" if is_correct else "INCORRECT DIAGNOSIS"
    badge_bg = colors.HexColor('#dcfce7') if is_correct else colors.HexColor('#fee2e2')
    badge_fg = colors.HexColor('#166534') if is_correct else colors.HexColor('#991b1b')

    results_table = [
        ["Parameter", "Observed / Evaluated Value", "Assessment Note"],
        ["Actual Rig Ground Truth", str(session_data.get('ground_truth_leak', 'N/A')), "Trainer Concealed Scenario"],
        ["Trainee Submitted Diagnosis", str(session_data.get('trainee_diagnosis', 'N/A')), result_badge],
        ["Model Prediction (Separately Labeled)", f"{session_data.get('ai_prediction', 'N/A')} ({int((session_data.get('ai_confidence') or 0.8)*100)}% conf)", f"Source: {session_data.get('ai_model_source', 'SIMULATED')}"],
        ["Time to Diagnosis", f"{session_data.get('duration_seconds', 0.0)} s", f"Standard target: <35s"],
        ["Hints Requested", str(session_data.get('hints_used', 0)), "Allowed in Practice Mode"],
        ["Procedure Compliance", str(session_data.get('procedure_compliance', 'NOT_ASSESSED')), "Trainer Observation"]
    ]
    t_results = Table(results_table, colWidths=[160, 190, 190])
    t_results.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f2d59')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (2, 2), (2, 2), badge_bg),
        ('TEXTCOLOR', (2, 2), (2, 2), badge_fg),
    ]))
    story.append(t_results)
    story.append(Spacer(1, 14))

    # Score Breakdown Section
    story.append(Paragraph("Scoring Rubric Breakdown", section_style))
    score_table = [
        ["Rubric Dimension", "Max Points", "Awarded Points", "Evaluation Method"],
        ["Diagnostic Correctness", "50", str(session_data.get('score_correctness', 0.0)), "Exact match with rig scenario"],
        ["Diagnosis Response Time", "20", str(session_data.get('score_time', 0.0)), "Benchmark target curve"],
        ["Independence & Attempt Efficiency", "20", str(session_data.get('score_independence', 0.0)), "Hint and re-attempt penalties"],
        ["Procedural Compliance", "10", str(session_data.get('score_compliance') or "NOT ASSESSED"), "Direct trainer evaluation"],
        ["Total Scaled Score", "100", f"{session_data.get('total_score', 0.0)} %", str(session_data.get('performance_category', 'Developing'))]
    ]
    t_score = Table(score_table, colWidths=[150, 80, 110, 200])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 14))

    # Instructor Remarks & Recommendations
    story.append(Paragraph("Instructor Remarks & Technical Suggestions", section_style))
    remarks_text = session_data.get('feedback_remarks') or "Trainee demonstrated consistent acoustic localization techniques."
    trainer_notes = session_data.get('trainer_notes') or "Standard session procedure followed."
    story.append(Paragraph(f"<b>System Suggestions:</b> {remarks_text}", body_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Trainer Notes:</b> {trainer_notes}", body_style))
    story.append(Spacer(1, 20))

    # Footer note
    story.append(Paragraph("<i>Note: LEAKSENSE platform records skills based on objective telemetry measurements. This report does not invent formal NSQF accreditation.</i>", ParagraphStyle('Foot', parent=styles['Italic'], fontSize=8, textColor=colors.gray)))

    doc.build(story)
    return buffer.getvalue()

def generate_sessions_csv(sessions_list: list) -> str:
    """Generates CSV export of training session records."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "SessionCode", "TraineeID", "TraineeName", "SessionType", "Status",
        "Difficulty", "GroundTruthLeak", "TraineeDiagnosis", "IsCorrect",
        "DurationSeconds", "HintsUsed", "ProcedureCompliance", "AiPrediction",
        "AiConfidence", "TotalScore", "PerformanceCategory", "CompletedAt"
    ])
    for s in sessions_list:
        writer.writerow([
            s.session_code,
            s.trainee.trainee_id if s.trainee else "N/A",
            s.trainee.full_name if s.trainee else "N/A",
            s.session_type,
            s.status,
            s.difficulty,
            s.ground_truth_leak,
            s.trainee_diagnosis or "None",
            "TRUE" if s.is_correct else "FALSE",
            s.duration_seconds or 0.0,
            s.hints_used,
            s.procedure_compliance,
            s.ai_prediction or "N/A",
            s.ai_confidence or 0.0,
            s.total_score or 0.0,
            s.performance_category or "N/A",
            s.completed_at.strftime("%Y-%m-%d %H:%M:%S") if s.completed_at else "Incomplete"
        ])
    return output.getvalue()
