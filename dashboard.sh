#!/bin/bash

# BookStore Monitoring Dashboard - Current Status Summary
echo "🏗️  BookStore GKE Deployment - Live Monitor"
echo "=============================================="
echo "📅 $(date)"
echo ""

# Cluster Overview
echo "🔧 CLUSTER STATUS:"
echo "  Project: lyrical-tooling-475815-i8"
echo "  Cluster: bookstore-cluster (us-central1-a)"
echo "  Node Type: e2-medium (2 vCPU, 4GB RAM)"
echo "  Quota Status: ⚠️  GCE quota exceeded (can't scale up)"
echo ""

# Resource Summary
echo "📊 RESOURCE UTILIZATION:"
kubectl top nodes 2>/dev/null | awk '
NR==1 {print "  " $0}
NR>1 {
  cpu_pct = $3
  mem_pct = $5
  gsub("%", "", cpu_pct)
  gsub("%", "", mem_pct)
  
  if (cpu_pct > 80) cpu_status = "🔴 HIGH"
  else if (cpu_pct > 60) cpu_status = "🟡 MED"
  else cpu_status = "🟢 OK"
  
  if (mem_pct > 80) mem_status = "🔴 HIGH"
  else if (mem_pct > 60) mem_status = "🟡 MED"  
  else mem_status = "🟢 OK"
  
  printf "  %-50s CPU: %s (%s%%) | MEM: %s (%s%%)\n", $1, cpu_status, cpu_pct, mem_status, mem_pct
}'
echo ""

# Services Status
echo "🚀 CORE SERVICES:"
kubectl get pods -n bookstore | awk '
BEGIN {
  services["mysql"] = 0
  services["account"] = 0
  services["consul"] = 0
}
/mysql/ && /Running/ { services["mysql"]++ }
/account/ && /Running/ { services["account"]++ }
/consul/ && /Running/ { services["consul"]++ }
END {
  printf "  🗄️  Database (MariaDB):   %s\n", (services["mysql"] > 0) ? "🟢 RUNNING" : "🔴 NOT RUNNING"
  printf "  👤 Account Service:     %s\n", (services["account"] > 0) ? "🟢 RUNNING" : "🔴 NOT RUNNING"  
  printf "  🔍 Service Discovery:   %s\n", (services["consul"] > 0) ? "🟢 RUNNING" : "🔴 NOT RUNNING"
}'
echo ""

# Deployments Summary
echo "📋 DEPLOYMENT STATUS:"
kubectl get deployments -n bookstore -o custom-columns="NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.spec.replicas" | head -5 | awk '
NR==1 {print "  " $0}
NR>1 {
  ready = ($2 == "") ? 0 : $2
  desired = $3
  if (ready == desired && ready > 0) status = "🟢"
  else if (ready > 0) status = "🟡"
  else status = "🔴"
  printf "  %s %-35s %s/%s\n", status, $1, ready, desired
}'
echo ""

# Current Issues
echo "⚠️  CURRENT ISSUES:"
kubectl get pods -n bookstore | grep -E "(Pending|Error|CrashLoop|ImagePull)" | awk '{
  printf "  🔴 %s: %s\n", $1, $3
}'

# Check specific issue with MariaDB
MYSQL_POD=$(kubectl get pods -n bookstore -l app=bookstore-mysql-db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$MYSQL_POD" ]; then
  if kubectl get pod $MYSQL_POD -n bookstore | grep -q "Pending"; then
    echo "  💡 MariaDB pending due to: Insufficient CPU resources"
  fi
fi
echo ""

# Resource Requirements Analysis  
echo "🔍 RESOURCE ANALYSIS:"
echo "  Current CPU requests across all pods:"
kubectl get pods -n bookstore -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.containers[*].resources.requests.cpu}{"\n"}{end}' 2>/dev/null | grep -v "^$" | awk '{
  if ($2 != "") {
    gsub("m", "", $2)
    total += $2
    count++
  }
}'
kubectl get pods -n bookstore -o jsonpath='{range .items[*]}{.spec.containers[*].resources.requests.cpu}{" "}{end}' 2>/dev/null | tr ' ' '\n' | grep -v "^$" | awk '
BEGIN {total=0}
{
  gsub("m", "")
  if ($1 != "") total += $1
}
END {
  printf "  Total requested: %dm CPU\n", total
  printf "  Available per node: 1000m CPU\n"
  printf "  Recommendation: %s\n", (total > 1800) ? "🔴 Over capacity - need resource optimization" : "🟢 Within capacity"
}'
echo ""

echo "🎯 NEXT STEPS:"
echo "  1. Optimize CPU resources for existing pods"
echo "  2. Increase GCE quotas or use smaller resource requests"  
echo "  3. Consider using burstable QoS instead of guaranteed"
echo "  4. Scale down non-essential services further"
echo ""

echo "📱 MONITORING COMMANDS:"
echo "  Watch pods: kubectl get pods -n bookstore -w"
echo "  Check resources: kubectl top pods -n bookstore"
echo "  View events: kubectl get events -n bookstore --sort-by='.lastTimestamp'"
echo ""