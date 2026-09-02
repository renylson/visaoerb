#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/.run/app.pid"
LOG_FILE="$APP_DIR/logs/app.log"
PORT="${PORT:-3000}"
URL="http://localhost:$PORT"

mkdir -p "$(dirname "$PID_FILE")" "$(dirname "$LOG_FILE")"

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

is_running() {
  [[ -f "$PID_FILE" ]] || return 1

  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

current_pid() {
  cat "$PID_FILE" 2>/dev/null || true
}

start_app() {
  if is_running; then
    echo "Aplicacao ja esta rodando. PID: $(current_pid)"
    echo "URL: $URL"
    return 0
  fi

  if [[ -f "$PID_FILE" ]]; then
    rm -f "$PID_FILE"
  fi

  cd "$APP_DIR"

  echo "Iniciando aplicacao..."
  PORT="$PORT" nohup npm start >> "$LOG_FILE" 2>&1 &
  local pid="$!"
  echo "$pid" > "$PID_FILE"

  sleep 2

  if kill -0 "$pid" 2>/dev/null; then
    echo "Aplicacao iniciada. PID: $pid"
    echo "URL: $URL"
    echo "Logs: $LOG_FILE"
  else
    rm -f "$PID_FILE"
    echo "Falha ao iniciar. Veja os logs em: $LOG_FILE"
    return 1
  fi
}

stop_app() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Aplicacao nao parece estar rodando: arquivo de PID nao encontrado."
    return 0
  fi

  local pid
  pid="$(current_pid)"

  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    echo "Processo nao encontrado. Removendo PID antigo."
    rm -f "$PID_FILE"
    return 0
  fi

  echo "Parando aplicacao. PID: $pid"
  kill "$pid"

  for _ in {1..10}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      echo "Aplicacao parada."
      return 0
    fi
    sleep 1
  done

  echo "Processo nao parou a tempo. Forcando parada..."
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "Aplicacao parada."
}

restart_app() {
  stop_app
  start_app
}

status_app() {
  if is_running; then
    echo "Aplicacao rodando. PID: $(current_pid)"
    echo "URL: $URL"
  else
    echo "Aplicacao parada."
  fi
}

tail_logs() {
  touch "$LOG_FILE"
  tail -n 80 "$LOG_FILE"
}

open_url() {
  if has_cmd xdg-open; then
    xdg-open "$URL" >/dev/null 2>&1 &
    echo "Abrindo $URL"
  else
    echo "Abra no navegador: $URL"
  fi
}

run_action() {
  case "$1" in
    start) start_app ;;
    stop) stop_app ;;
    restart) restart_app ;;
    status) status_app ;;
    logs) tail_logs ;;
    open) open_url ;;
    *) echo "Opcao invalida: $1"; return 1 ;;
  esac
}

show_message() {
  local title="$1"
  local message="$2"

  if [[ -n "${DISPLAY:-}" ]] && has_cmd zenity; then
    zenity --info --title="$title" --width=520 --text="$message" 2>/dev/null || true
  else
    printf '\n%s\n%s\n\n' "$title" "$message"
  fi
}

capture_action() {
  local action="$1"
  local output

  if output="$(run_action "$action" 2>&1)"; then
    show_message "Visao Vivo ERB" "$output"
  else
    show_message "Visao Vivo ERB - erro" "$output"
  fi
}

gui_menu() {
  while true; do
    local option
    option="$(
      zenity --list \
        --title="Visao Vivo ERB" \
        --text="Escolha uma acao para a aplicacao" \
        --width=520 \
        --height=360 \
        --column="Acao" \
        --column="Descricao" \
        "start" "Subir aplicacao" \
        "stop" "Parar aplicacao" \
        "restart" "Reiniciar aplicacao" \
        "status" "Ver status" \
        "logs" "Ver ultimas linhas do log" \
        "open" "Abrir URL no navegador" \
        "exit" "Sair" \
        2>/dev/null
    )" || exit 0

    [[ "$option" == "exit" ]] && exit 0
    capture_action "$option"
  done
}

terminal_menu() {
  while true; do
    clear 2>/dev/null || true
    echo "================================="
    echo " Visao Vivo ERB - Controle"
    echo "================================="
    status_app
    echo
    echo "1) Subir aplicacao"
    echo "2) Parar aplicacao"
    echo "3) Reiniciar aplicacao"
    echo "4) Ver status"
    echo "5) Ver ultimas linhas do log"
    echo "6) Mostrar URL"
    echo "0) Sair"
    echo
    read -r -p "Escolha uma opcao: " option
    echo

    case "$option" in
      1) run_action start ;;
      2) run_action stop ;;
      3) run_action restart ;;
      4) run_action status ;;
      5) run_action logs ;;
      6) run_action open ;;
      0) exit 0 ;;
      *) echo "Opcao invalida." ;;
    esac

    echo
    read -r -p "Pressione ENTER para continuar..." _
  done
}

case "${1:-menu}" in
  start|stop|restart|status|logs|open)
    run_action "$1"
    ;;
  menu)
    if [[ -n "${DISPLAY:-}" ]] && has_cmd zenity; then
      gui_menu
    else
      terminal_menu
    fi
    ;;
  *)
    echo "Uso: $0 [menu|start|stop|restart|status|logs|open]"
    exit 1
    ;;
esac
