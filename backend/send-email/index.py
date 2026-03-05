import json
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def handler(event: dict, context) -> dict:
    """Отправка заявки с сайта на почту vostokinveststal@mail.ru"""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    email = body.get('email', '').strip()
    message = body.get('message', '').strip()

    if not name or not phone:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False),
        }

    months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    dt = datetime.now()
    now = f"{dt.day} {months[dt.month - 1]} {dt.year}, {dt.strftime('%H:%M')}"
    received_line = f"Заявка получена: {now}"

    email_login = os.environ['EMAIL_LOGIN']
    email_password = os.environ['EMAIL_PASSWORD']
    recipient = 'vostokinveststal@mail.ru'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Новая заявка с сайта — Лендинг газобетона'
    msg['From'] = email_login
    msg['To'] = recipient

    source = 'Лендинг газобетона (Автоклавный газобетон — Восток-ИнвестСталь)'

    text_body = f"""{received_line}

Имя: {name}
Телефон: {phone}
Email: {email if email else 'не указан'}
Сообщение: {message if message else 'не указано'}
Источник: {source}
"""

    html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <p style="font-size: 15px; color: #888; margin-bottom: 16px;">{received_line}</p>
  <h2 style="color: #1E3A5F; margin-top: 0;">Новая заявка с сайта</h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
    <tr><td style="padding: 8px; font-weight: bold; color: #666;">Имя:</td><td style="padding: 8px;">{name}</td></tr>
    <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #666;">Телефон:</td><td style="padding: 8px;"><a href="tel:{phone}">{phone}</a></td></tr>
    <tr><td style="padding: 8px; font-weight: bold; color: #666;">Email:</td><td style="padding: 8px;"><a href="mailto:{email}">{email if email else 'не указан'}</a></td></tr>
    <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #666;">Сообщение:</td><td style="padding: 8px;">{message if message else 'не указано'}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; color: #666;">Источник:</td><td style="padding: 8px; color: #4CAF50;">{source}</td></tr>
  </table>
</body>
</html>
"""

    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    context_ssl = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.mail.ru', 465, context=context_ssl) as server:
        server.login(email_login, email_password)
        server.sendmail(email_login, recipient, msg.as_string())

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({'success': True}),
    }