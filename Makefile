.PHONY: proto python go node install-python install-go install-node run-python run-go run-node run-server1 run-server2 run-server3 create-conda-env activate-conda-env

PYTHON = python
GO = go
NODE = node

run-server1:
	$(PYTHON) server.py 50051

run-server2:
	$(PYTHON) server.py 50052

run-server3:
	$(PYTHON) server.py 50053

run-python:
	$(PYTHON) client.py

run-go:
	$(GO) run client.go

run-node:
	$(NODE) client.js

install-go:
	$(GO) mod download

install-node:
	npm install

create-conda-env:
	conda create -n redesocial python=3.11 -y

activate-conda-env:
	@echo "Execute: conda activate redesocial"

install-python:
	conda install pip -y
	pip install grpcio grpcio-tools protobuf pytz

proto-py:
	python3 -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. redesocial.proto

proto-go:
	protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative redesocial.proto

proto-js:
	npx grpc_tools_node_protoc --js_out=import_style=commonjs,binary:. --grpc_out=grpc_js:. -I. redesocial.proto

proto-all: proto-py proto-go proto-js

help:
	@echo "Comandos disponíveis:"
	@echo "  make run-server1    - Iniciar servidor na porta 50051"
	@echo "  make run-server2    - Iniciar servidor na porta 50052"
	@echo "  make run-server3    - Iniciar servidor na porta 50053"
	@echo "  make run-python     - Executar cliente Python "
	@echo "  make run-go         - Executar cliente Go "
	@echo "  make run-node       - Executar cliente Node.js "
	@echo "  make install-go     - Instalar dependências Go"
	@echo "  make install-node   - Instalar dependências Node.js"
	@echo "  make create-conda-env - Criar um ambiente conda para Python"
	@echo "  make activate-conda-env - Ativar o ambiente conda para Python"
	@echo "  make install-python - Instalar dependências Python via conda/pip"
