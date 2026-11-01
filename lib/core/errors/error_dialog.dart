import 'package:flutter/material.dart';

import '../localization/app_localizations.dart';

Future<void> showGlobalErrorDialog(
  BuildContext context, {
  String? title,
  required String message,
  VoidCallback? onRetry,
  VoidCallback? onDismiss,
}) async {
  if (!context.mounted) return;
  final l10n = AppLocalizations.of(context);

  return showDialog<void>(
    context: context,
    barrierDismissible: onRetry == null,
    builder: (ctx) {
      final theme = Theme.of(ctx);
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.withAlpha(25),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline_rounded,
            color: Colors.redAccent,
            size: 36,
          ),
        ),
        title: Text(
          title ?? l10n.error,
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          message,
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          if (onRetry != null) ...[
            OutlinedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                onDismiss?.call();
              },
              child: Text(l10n.cancel),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh, size: 18),
              label: Text(l10n.retry),
              onPressed: () {
                Navigator.of(ctx).pop();
                onRetry();
              },
            ),
          ] else ...[
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                onDismiss?.call();
              },
              child: Text(l10n.ok),
            ),
          ],
        ],
      );
    },
  );
}

Future<void> showGlobalSuccessDialog(
  BuildContext context, {
  String? title,
  required String message,
  VoidCallback? onConfirm,
}) async {
  if (!context.mounted) return;
  final l10n = AppLocalizations.of(context);

  return showDialog<void>(
    context: context,
    builder: (ctx) {
      final theme = Theme.of(ctx);
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green.withAlpha(25),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_outline_rounded,
            color: Colors.green,
            size: 36,
          ),
        ),
        title: Text(
          title ?? l10n.success,
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          message,
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              onConfirm?.call();
            },
            child: Text(l10n.ok),
          ),
        ],
      );
    },
  );
}
