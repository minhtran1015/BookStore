FROM grafana/grafana

# Thư mục tạm để chứa dashboards trước khi copy vào volume
RUN mkdir -p /tmp/dashboards-source

# Add dashboards vào thư mục tạm
ADD services-dashboard.json /tmp/dashboards-source/services-dashboard.json
ADD docker-container-dashboard.json /tmp/dashboards-source/docker-container-dashboard.json
ADD docker-all-dashboard.json /tmp/dashboards-source/docker-all-dashboard.json

# Add các file cấu hình datasource/dashboard provider (sẽ bị ghi đè bởi ConfigMap nhưng vẫn giữ lại để tham khảo)
ADD datasource.yml /etc/grafana/provisioning/datasources/datasource.yml
ADD dashboard.yml /etc/grafana/provisioning/dashboards/dashboard.yml

# Không cần RUN mkdir và ADD trực tiếp vào /var/lib/grafana/dashboards nữa
# RUN mkdir -p /var/lib/grafana/dashboards
# ADD services-dashboard.json /var/lib/grafana/dashboards/services-dashboard.json
# ADD docker-container-dashboard.json /var/lib/grafana/dashboards/docker-container-dashboard.json
# ADD docker-all-dashboard.json /var/lib/grafana/dashboards/docker-all-dashboard.json