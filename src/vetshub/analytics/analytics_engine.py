"""Analytics Engine - Data analytics and reporting for farm operations"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict


class AnalyticsEngine:
    """
    Provides data analytics and reporting capabilities for farm operations.
    Leverages data to improve decision-making and optimize resource use.
    """
    
    def __init__(self, farm_manager):
        self.farm_manager = farm_manager
    
    def get_financial_summary(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get comprehensive financial summary"""
        records = self.farm_manager.list_financial_records(start_date=start_date, end_date=end_date)
        
        total_income = sum(r.amount for r in records if r.transaction_type == "income")
        total_expenses = sum(r.amount for r in records if r.transaction_type == "expense")
        net_profit = total_income - total_expenses
        
        # Category breakdown
        income_by_category = defaultdict(float)
        expense_by_category = defaultdict(float)
        
        for record in records:
            if record.transaction_type == "income":
                income_by_category[record.category] += record.amount
            else:
                expense_by_category[record.category] += record.amount
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "profit_margin": (net_profit / total_income * 100) if total_income > 0 else 0,
            "income_by_category": dict(income_by_category),
            "expense_by_category": dict(expense_by_category),
            "record_count": len(records),
        }
    
    def get_crop_summary(self) -> Dict[str, Any]:
        """Get comprehensive crop summary and analytics"""
        crops = self.farm_manager.list_crops()
        
        if not crops:
            return {
                "total_crops": 0,
                "total_area_acres": 0,
                "status_breakdown": {},
                "total_expenses": 0,
                "total_revenue": 0,
                "total_profit": 0,
            }
        
        total_area = sum(c.area_acres for c in crops)
        total_expenses = sum(c.expenses for c in crops)
        total_revenue = sum(c.revenue for c in crops)
        
        status_breakdown = defaultdict(int)
        for crop in crops:
            status_breakdown[crop.status] += 1
        
        # Calculate average yield per acre for harvested crops
        harvested_crops = [c for c in crops if c.status == "harvested" and c.yield_amount]
        avg_yield_per_acre = (
            sum(c.get_yield_per_acre() for c in harvested_crops if c.get_yield_per_acre())
            / len(harvested_crops)
        ) if harvested_crops else 0
        
        return {
            "total_crops": len(crops),
            "total_area_acres": total_area,
            "status_breakdown": dict(status_breakdown),
            "total_expenses": total_expenses,
            "total_revenue": total_revenue,
            "total_profit": total_revenue - total_expenses,
            "avg_yield_per_acre": avg_yield_per_acre,
            "harvested_crops": len(harvested_crops),
        }
    
    def get_livestock_summary(self) -> Dict[str, Any]:
        """Get comprehensive livestock summary and analytics"""
        livestock = self.farm_manager.list_livestock()
        
        if not livestock:
            return {
                "total_animals": 0,
                "species_breakdown": {},
                "status_breakdown": {},
                "total_value": 0,
            }
        
        species_breakdown = defaultdict(int)
        status_breakdown = defaultdict(int)
        total_purchase_value = 0
        total_sale_value = 0
        
        for animal in livestock:
            species_breakdown[animal.species] += 1
            status_breakdown[animal.status] += 1
            total_purchase_value += animal.purchase_price
            if animal.sale_price:
                total_sale_value += animal.sale_price
        
        # Health metrics
        animals_with_health_records = len([a for a in livestock if a.health_records])
        animals_vaccinated = len([a for a in livestock if a.vaccinations])
        
        return {
            "total_animals": len(livestock),
            "species_breakdown": dict(species_breakdown),
            "status_breakdown": dict(status_breakdown),
            "total_purchase_value": total_purchase_value,
            "total_sale_value": total_sale_value,
            "profit_from_sales": total_sale_value - total_purchase_value,
            "animals_with_health_records": animals_with_health_records,
            "animals_vaccinated": animals_vaccinated,
        }
    
    def get_labor_summary(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get comprehensive labor summary and analytics"""
        records = self.farm_manager.list_labor_records(start_date=start_date, end_date=end_date)
        
        if not records:
            return {
                "total_records": 0,
                "total_hours": 0,
                "total_cost": 0,
                "workers": [],
            }
        
        total_hours = sum(r.hours_worked for r in records)
        total_cost = sum(r.total_cost for r in records)
        
        # Worker breakdown
        worker_stats = defaultdict(lambda: {"hours": 0, "cost": 0, "tasks": 0})
        for record in records:
            worker_stats[record.worker_name]["hours"] += record.hours_worked
            worker_stats[record.worker_name]["cost"] += record.total_cost
            worker_stats[record.worker_name]["tasks"] += 1
        
        return {
            "total_records": len(records),
            "total_hours": total_hours,
            "total_cost": total_cost,
            "avg_hourly_rate": total_cost / total_hours if total_hours > 0 else 0,
            "worker_count": len(worker_stats),
            "worker_breakdown": dict(worker_stats),
        }
    
    def get_profitability_analysis(self) -> Dict[str, Any]:
        """Analyze overall farm profitability"""
        financial_summary = self.get_financial_summary()
        crop_summary = self.get_crop_summary()
        livestock_summary = self.get_livestock_summary()
        
        return {
            "overall_net_profit": financial_summary["net_profit"],
            "crop_profit": crop_summary.get("total_profit", 0),
            "livestock_profit": livestock_summary.get("profit_from_sales", 0),
            "profit_margin": financial_summary["profit_margin"],
            "total_revenue": financial_summary["total_income"],
            "total_expenses": financial_summary["total_expenses"],
        }
    
    def get_resource_utilization(self) -> Dict[str, Any]:
        """Analyze resource utilization"""
        crop_summary = self.get_crop_summary()
        labor_summary = self.get_labor_summary()
        
        return {
            "land_utilization": {
                "total_acres_in_use": crop_summary.get("total_area_acres", 0),
                "number_of_crops": crop_summary.get("total_crops", 0),
            },
            "labor_utilization": {
                "total_labor_hours": labor_summary.get("total_hours", 0),
                "total_labor_cost": labor_summary.get("total_cost", 0),
                "number_of_workers": labor_summary.get("worker_count", 0),
            },
        }
    
    def generate_report(self, report_type: str = "comprehensive") -> Dict[str, Any]:
        """Generate a comprehensive farm report"""
        if report_type == "comprehensive":
            return {
                "report_date": datetime.now().isoformat(),
                "farm_name": self.farm_manager.farm_name,
                "financial_summary": self.get_financial_summary(),
                "crop_summary": self.get_crop_summary(),
                "livestock_summary": self.get_livestock_summary(),
                "labor_summary": self.get_labor_summary(),
                "profitability_analysis": self.get_profitability_analysis(),
                "resource_utilization": self.get_resource_utilization(),
            }
        elif report_type == "financial":
            return {
                "report_date": datetime.now().isoformat(),
                "farm_name": self.farm_manager.farm_name,
                "financial_summary": self.get_financial_summary(),
                "profitability_analysis": self.get_profitability_analysis(),
            }
        else:
            return {"error": f"Unknown report type: {report_type}"}
