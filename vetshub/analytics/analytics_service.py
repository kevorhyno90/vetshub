"""
Analytics service for farm management data
"""
from datetime import datetime, timedelta
from sqlalchemy import func, extract
from vetshub.models import db
from vetshub.models.crop import Crop, CropCycle
from vetshub.models.livestock import Livestock, HealthRecord
from vetshub.models.financial import Budget, Transaction
from vetshub.models.labor import Worker, WorkLog


class AnalyticsService:
    """Service for generating analytics and insights"""
    
    @staticmethod
    def get_crop_performance():
        """Analyze crop yield performance"""
        cycles = CropCycle.query.filter(
            CropCycle.status == 'harvested',
            CropCycle.yield_amount.isnot(None)
        ).all()
        
        performance_by_crop = {}
        for cycle in cycles:
            crop_name = cycle.crop.name
            if crop_name not in performance_by_crop:
                performance_by_crop[crop_name] = {
                    'crop_name': crop_name,
                    'total_cycles': 0,
                    'total_yield': 0,
                    'total_area': 0,
                    'avg_yield_per_hectare': 0
                }
            
            performance_by_crop[crop_name]['total_cycles'] += 1
            performance_by_crop[crop_name]['total_yield'] += cycle.yield_amount or 0
            performance_by_crop[crop_name]['total_area'] += cycle.area_hectares or 0
        
        # Calculate averages
        for crop_data in performance_by_crop.values():
            if crop_data['total_area'] > 0:
                crop_data['avg_yield_per_hectare'] = crop_data['total_yield'] / crop_data['total_area']
        
        return list(performance_by_crop.values())
    
    @staticmethod
    def get_livestock_health_summary():
        """Summarize livestock health statistics"""
        total_livestock = Livestock.query.filter_by(status='active').count()
        
        # Health records in the last 90 days
        ninety_days_ago = datetime.now().date() - timedelta(days=90)
        recent_records = HealthRecord.query.filter(
            HealthRecord.record_date >= ninety_days_ago
        ).all()
        
        health_by_type = {}
        total_health_cost = 0
        
        for record in recent_records:
            record_type = record.record_type
            if record_type not in health_by_type:
                health_by_type[record_type] = 0
            health_by_type[record_type] += 1
            total_health_cost += record.cost or 0
        
        # Livestock by species
        livestock_by_species = db.session.query(
            Livestock.species,
            func.count(Livestock.id).label('count')
        ).filter_by(status='active').group_by(Livestock.species).all()
        
        return {
            'total_active_livestock': total_livestock,
            'health_records_last_90_days': len(recent_records),
            'total_health_cost_last_90_days': total_health_cost,
            'records_by_type': health_by_type,
            'livestock_by_species': [
                {'species': species, 'count': count}
                for species, count in livestock_by_species
            ]
        }
    
    @staticmethod
    def get_financial_summary(fiscal_year=None):
        """Generate financial summary"""
        if fiscal_year is None:
            fiscal_year = datetime.now().year
        
        # Get budgets for the fiscal year
        budgets = Budget.query.filter_by(fiscal_year=fiscal_year).all()
        
        total_planned = sum(b.planned_amount for b in budgets)
        total_actual = sum(b.actual_amount for b in budgets)
        
        # Get transactions
        transactions = Transaction.query.filter(
            extract('year', Transaction.transaction_date) == fiscal_year
        ).all()
        
        total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
        
        # Breakdown by category
        budget_by_category = {}
        for budget in budgets:
            if budget.category not in budget_by_category:
                budget_by_category[budget.category] = {
                    'planned': 0,
                    'actual': 0,
                    'variance': 0
                }
            budget_by_category[budget.category]['planned'] += budget.planned_amount
            budget_by_category[budget.category]['actual'] += budget.actual_amount
            budget_by_category[budget.category]['variance'] = (
                budget_by_category[budget.category]['actual'] - 
                budget_by_category[budget.category]['planned']
            )
        
        return {
            'fiscal_year': fiscal_year,
            'total_planned_budget': total_planned,
            'total_actual_expenses': total_actual,
            'budget_variance': total_actual - total_planned,
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_profit': total_income - total_expenses,
            'budget_by_category': budget_by_category
        }
    
    @staticmethod
    def get_labor_statistics(start_date=None, end_date=None):
        """Analyze labor statistics"""
        if start_date is None:
            start_date = datetime.now().date() - timedelta(days=30)
        if end_date is None:
            end_date = datetime.now().date()
        
        # Get work logs in date range
        logs = WorkLog.query.filter(
            WorkLog.work_date >= start_date,
            WorkLog.work_date <= end_date
        ).all()
        
        total_hours = sum(log.hours_worked for log in logs)
        total_labor_cost = sum(
            log.hours_worked * (log.worker.hourly_rate or 0)
            for log in logs if log.worker
        )
        
        # Activity breakdown
        activity_stats = {}
        for log in logs:
            activity = log.activity_type or 'unspecified'
            if activity not in activity_stats:
                activity_stats[activity] = {
                    'hours': 0,
                    'cost': 0
                }
            activity_stats[activity]['hours'] += log.hours_worked
            activity_stats[activity]['cost'] += log.hours_worked * (log.worker.hourly_rate or 0)
        
        # Active workers
        active_workers = Worker.query.filter_by(status='active').count()
        
        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_hours_worked': total_hours,
            'total_labor_cost': total_labor_cost,
            'active_workers': active_workers,
            'activity_breakdown': activity_stats
        }
    
    @staticmethod
    def get_dashboard_overview():
        """Get overview dashboard data"""
        return {
            'crop_performance': AnalyticsService.get_crop_performance(),
            'livestock_health': AnalyticsService.get_livestock_health_summary(),
            'financial_summary': AnalyticsService.get_financial_summary(),
            'labor_statistics': AnalyticsService.get_labor_statistics()
        }
