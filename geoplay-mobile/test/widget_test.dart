import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:geoplay/app.dart';

void main() {
  testWidgets('GeoPlayApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: GeoPlayApp(),
      ),
    );

    // Verify the app renders without errors.
    expect(find.text('GeoPlay'), findsOneWidget);
  });
}
