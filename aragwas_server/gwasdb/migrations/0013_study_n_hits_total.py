# -*- coding: utf-8 -*-
# Generated by Django 1.11b1 on 2017-08-11 13:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gwasdb', '0012_auto_20170811_1327'),
    ]

    operations = [
        migrations.AddField(
            model_name='study',
            name='n_hits_total',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
