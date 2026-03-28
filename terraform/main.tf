provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "coindrop_vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support = true
  enable_dns_hostnames = true

  tags = {
    Name = "coindrop-vpc"
  }
}

resource "aws_subnet" "coindrop_subnet" {
  vpc_id     = aws_vpc.coindrop_vpc.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "coindrop-subnet"
  }
}

resource "aws_internet_gateway" "coindrop_igw" {
  vpc_id = aws_vpc.coindrop_vpc.id

  tags = {
    Name = "coindrop-igw"
  }
}

resource "aws_route_table" "coindrop_rt" {
  vpc_id = aws_vpc.coindrop_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.coindrop_igw.id
  }

  tags = {
    Name = "coindrop-route-table"
  }
}

resource "aws_route_table_association" "coindrop_rta" {
  subnet_id      = aws_subnet.coindrop_subnet.id
  route_table_id = aws_route_table.coindrop_rt.id
}

resource "aws_security_group" "coindrop_sg" {
  name        = "coindrop-security-group"
  description = "Allow HTTP and HTTPS traffic"
  vpc_id      = aws_vpc.coindrop_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "coindrop-sg"
  }
}

resource "aws_ecs_cluster" "coindrop_cluster" {
  name = "coindrop-cluster"

  tags = {
    Name = "coindrop-cluster"
  }
}

resource "aws_ecs_task_definition" "coindrop_task" {
  family                = "coindrop-task"
  network_mode          = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                   = "256"
  memory                = "512"

  container_definitions = jsonencode([
    {
      name      = "coindrop-container"
      image     = "${var.dockerhub_username}/coindrop:latest"
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5000"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/coindrop"
          "awslogs-region" = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "coindrop-task"
  }
}

resource "aws_cloudwatch_log_group" "coindrop_log_group" {
  name              = "/ecs/coindrop"
  retention_in_days = 14

  tags = {
    Name = "coindrop-log-group"
  }
}

resource "aws_ecs_service" "coindrop_service" {
  name            = "coindrop-service"
  cluster         = aws_ecs_cluster.coindrop_cluster.id
  task_definition = aws_ecs_task_definition.coindrop_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.coindrop_subnet.id]
    security_groups  = [aws_security_group.coindrop_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.coindrop_target_group.arn
    container_name   = "coindrop-container"
    container_port   = 5000
  }

  tags = {
    Name = "coindrop-service"
  }
}

resource "aws_lb" "coindrop_lb" {
  name               = "coindrop-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.coindrop_sg.id]
  subnets            = [aws_subnet.coindrop_subnet.id]

  tags = {
    Name = "coindrop-lb"
  }
}

resource "aws_lb_target_group" "coindrop_target_group" {
  name     = "coindrop-target-group"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.coindrop_vpc.id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "coindrop-target-group"
  }
}

resource "aws_lb_listener" "coindrop_listener" {
  load_balancer_arn = aws_lb.coindrop_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.coindrop_target_group.arn
  }
}
