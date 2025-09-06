output "nginx_service_name" {
  value = aws_ecs_service.nginx.name
}

output "task_definition" {
  value = aws_ecs_task_definition.nginx.arn
}
