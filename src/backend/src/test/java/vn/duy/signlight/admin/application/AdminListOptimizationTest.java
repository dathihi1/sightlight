package vn.duy.signlight.admin.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import vn.duy.signlight.admin.repository.AdminSubscriptionQueryRepository;
import vn.duy.signlight.article.application.ArticleService;
import vn.duy.signlight.article.repository.ArticleRepository;
import vn.duy.signlight.article.web.dto.ArticleDtos;
import vn.duy.signlight.billing.domain.Subscription;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.repository.ChapterRepository;
import vn.duy.signlight.content.repository.CourseRepository;
import vn.duy.signlight.content.repository.ExerciseOptionRepository;
import vn.duy.signlight.content.repository.ExerciseRepository;
import vn.duy.signlight.content.repository.LessonContentBlockRepository;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;
import vn.duy.signlight.content.repository.UnitRepository;
import vn.duy.signlight.gamification.domain.Quest;
import vn.duy.signlight.gamification.repository.QuestRepository;
import vn.duy.signlight.gamification.repository.StreakRepository;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.learning.repository.LessonCompletionRepository;
import vn.duy.signlight.notification.application.NotificationService;

class AdminListOptimizationTest {

    @Test
    void usersCombineSearchStatusAndRoleAndBatchSubscriptions() {
        AppUserRepository users = mock(AppUserRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        AdminSubscriptionQueryRepository subscriptions = mock(AdminSubscriptionQueryRepository.class);
        UUID userId = UUID.randomUUID();
        AppUser user = AppUser.builder().id(userId).email("lan@example.com").status("ACTIVE")
                .roles(Set.of("ROLE_ADMIN")).createdAt(Instant.parse("2026-01-01T00:00:00Z")).build();
        when(users.adminSearch(eq("lan"), eq("ACTIVE"), eq("ROLE_ADMIN"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));
        when(profiles.findAllById(List.of(userId))).thenReturn(List.of(UserProfile.builder()
                .userId(userId).displayName("Lan").timezone("Asia/Ho_Chi_Minh").build()));
        when(subscriptions.findActiveByUserIds(eq(List.of(userId)), any(Instant.class))).thenReturn(List.of(
                Subscription.builder().userId(userId).planId("PRO").status("ACTIVE")
                        .expiresAt(Instant.parse("2099-01-01T00:00:00Z")).build()));

        AdminUserService service = new AdminUserService(users, profiles, subscriptions,
                mock(StreakRepository.class), mock(LessonCompletionRepository.class), mock(NotificationService.class));
        var result = service.listUsers(" lan ", "active", "ROLE_ADMIN", 0, 500);

        assertEquals(1, result.items().size());
        assertEquals("Lan", result.items().getFirst().displayName());
        assertEquals("PRO", result.items().getFirst().planName());
        verify(users).adminSearch(eq("lan"), eq("ACTIVE"), eq("ROLE_ADMIN"), argThat(p -> p.getPageSize() == 100));
        verify(subscriptions).findActiveByUserIds(eq(List.of(userId)), any(Instant.class));
    }

    @Test
    void signsCombineTopicStatusAndLevelWithBoundedSize() {
        SignRepository signs = mock(SignRepository.class);
        when(signs.adminSearch(eq("xin"), eq("Greeting"), eq("PUBLISHED"), eq("A1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(Sign.builder().id(UUID.randomUUID()).word("Xin chào")
                        .topic("Greeting").status("PUBLISHED").cefrLevel("A1").build())));
        AdminSignService service = new AdminSignService(signs, mock(SignVideoRepository.class),
                mock(CourseRepository.class), mock(MediaUrlService.class));

        var result = service.getSignList(" xin ", "Greeting", "published", "a1", 0, 1000);

        assertEquals(1, result.items().size());
        verify(signs).adminSearch(eq("xin"), eq("Greeting"), eq("PUBLISHED"), eq("A1"),
                argThat(p -> p.getPageSize() == 100 && p.getSort().getOrderFor("word") != null));
    }

    @Test
    void questsUseDatabasePaginationAndCombinedFilters() {
        QuestRepository quests = mock(QuestRepository.class);
        when(quests.adminSearch(eq("camera"), eq("DAILY"), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(Quest.builder().id(UUID.randomUUID()).title("Camera")
                        .questType("DAILY").targetAction("PRACTICE_AI").active(true).build())));
        AdminQuestService service = new AdminQuestService(quests);

        var result = service.listQuests(" camera ", "daily", true, 0, 999);

        assertEquals(1, result.items().size());
        verify(quests).adminSearch(eq("camera"), eq("DAILY"), eq(true),
                argThat(p -> p.getPageSize() == 100 && p.getSort().getOrderFor("orderIndex") != null));
    }

    @Test
    void articleAdminListUsesSummaryProjectionWithoutBodies() {
        ArticleRepository articles = mock(ArticleRepository.class);
        ArticleRepository.ArticleSummaryProjection summary = mock(ArticleRepository.ArticleSummaryProjection.class);
        when(summary.getId()).thenReturn(UUID.randomUUID());
        when(summary.getSlug()).thenReturn("vsl-tip");
        when(summary.getTitleVi()).thenReturn("VSL tip");
        when(summary.getTags()).thenReturn("VSL, Tips");
        when(articles.adminSearch(eq("vsl"), eq("tips"), eq("VSL"), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(summary)));
        ArticleService service = new ArticleService(articles);

        ArticleDtos.ArticleListResult result = service.listAdminArticles(" vsl ", "tips", "VSL", false, 0, 250);

        assertEquals(1, result.items().size());
        assertEquals(List.of("VSL", "Tips"), result.items().getFirst().tags());
        verify(articles).adminSearch(eq("vsl"), eq("tips"), eq("VSL"), eq(false),
                argThat(p -> p.getPageSize() == 100));
    }

    @Test
    void adminCourseListIncludesDraftsAndUsesStableOrdering() {
        CourseRepository courses = mock(CourseRepository.class);
        when(courses.adminSearch(eq("vsl"), eq("DRAFT"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(
                Course.builder().id(UUID.randomUUID()).code("VSL").name("Vietnamese Sign Language").status("DRAFT").build())));
        AdminLmsService service = new AdminLmsService(mock(LessonRepository.class), mock(ExerciseRepository.class),
                mock(ExerciseOptionRepository.class), mock(LessonContentBlockRepository.class), mock(SignRepository.class),
                mock(SignVideoRepository.class), mock(MediaUrlService.class), courses, mock(UnitRepository.class),
                mock(ChapterRepository.class));

        var result = service.listCourses(" vsl ", "draft", 0, 200);

        assertEquals("DRAFT", result.items().getFirst().status());
        assertFalse(result.items().isEmpty());
        verify(courses).adminSearch(eq("vsl"), eq("DRAFT"),
                argThat(p -> p.getPageSize() == 100 && p.getSort().getOrderFor("code") != null));
    }
}
